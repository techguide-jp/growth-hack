<script lang="ts">
    import { upload } from "@vercel/blob/client";
    import { browser } from "$app/environment";
    import ProjectHelpTypePicker from "$lib/components/projects/ProjectHelpTypePicker.svelte";
    import ProjectTagInput from "$lib/components/projects/ProjectTagInput.svelte";
    import {
        PROJECT_SCREENSHOT_MAX_COUNT,
        PROJECT_SCREENSHOT_MAX_SIZE_BYTES,
        PROJECT_STAGE_MAP,
        getProjectPublishChecklist,
        getProjectStageInfo,
    } from "$lib/constants/project";
    import {
        prepareProjectScreenshotFiles,
        releasePreparedProjectScreenshotFile,
        type PreparedProjectScreenshotFile,
    } from "$lib/shared/media/client";
    import {
        createProjectScreenshotPathname,
        PROJECT_SCREENSHOT_FILE_INPUT_ACCEPT,
        type MediaStorageDriver,
    } from "$lib/shared/media/config";
    import type {
        ProjectHelpType,
        ProjectStage,
        ProjectStatus,
    } from "$lib/shared/domain";
    import { onDestroy, onMount } from "svelte";

    type FormValues = {
        title?: string;
        oneLiner?: string;
        problemStatement?: string;
        projectStage?: string;
        helpTypes?: string;
        helpRequest?: string;
        highlights?: string;
        nextMilestone?: string;
        feedbackRequest?: string;
        backgroundNote?: string;
        publicUrl?: string;
        repoUrl?: string;
        demoUrl?: string;
        tags?: string;
        keptImagesJson?: string;
        uploadedImagesJson?: string;
        draftProjectId?: string;
        statusIntent?: string;
    };

    type MediaUploadContext = {
        driver: MediaStorageDriver;
        supportsDirectUpload: boolean;
        userId: string;
        projectId: string;
    };

    type LocalPreparedImage = {
        id: string;
        file: File;
        previewUrl: string;
    };

    type UploadedImage = {
        id: string;
        name: string;
        size: number;
        url: string;
        previewUrl: string;
        progress: number;
        status: "uploading" | "uploaded";
        previewIsObjectUrl: boolean;
    };

    type EditorProject = {
        id?: string;
        title: string;
        oneLiner: string;
        problemStatement: string;
        projectStage: ProjectStage | null;
        helpTypes: ProjectHelpType[];
        helpRequest: string;
        highlights: string[];
        nextMilestone: string;
        feedbackRequest: string;
        backgroundNote: string;
        publicUrl?: string;
        repoUrl?: string;
        demoUrl?: string;
        tags: string[];
        images: string[];
        status: ProjectStatus;
    };

    export let mode: "create" | "edit";
    export let form:
        | {
              message?: string;
              values?: FormValues;
          }
        | undefined;
    export let project: EditorProject | undefined = undefined;
    export let uploadContext: MediaUploadContext;

    const stageOptions = Object.entries(PROJECT_STAGE_MAP).map(([value, info]) => ({
        value: value as ProjectStage,
        ...info,
    }));

    function parseDelimitedValues(raw: string) {
        return raw
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }

    function parseJsonStringArray(raw: string | undefined) {
        if (raw === undefined) {
            return null;
        }

        if (raw.trim().length === 0) {
            return [];
        }

        try {
            const parsed = JSON.parse(raw);

            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed.filter((item): item is string => typeof item === "string");
        } catch {
            return [];
        }
    }

    function getKeepButtonLabel(status: ProjectStatus) {
        switch (status) {
            case "published":
                return "公開状態のまま保存";
            case "archived":
                return "アーカイブのまま保存";
            default:
                return "下書きを保存";
        }
    }

    function toErrorMessage(error: unknown) {
        return error instanceof Error
            ? error.message
            : "スクリーンショットの処理に失敗しました。";
    }

    function getImageCountLimitMessage() {
        return `スクリーンショットは${PROJECT_SCREENSHOT_MAX_COUNT}枚まで登録できます。`;
    }

    const initialProject = project ?? {
        title: "",
        oneLiner: "",
        problemStatement: "",
        projectStage: null,
        helpTypes: [],
        helpRequest: "",
        highlights: [],
        nextMilestone: "",
        feedbackRequest: "",
        backgroundNote: "",
        publicUrl: "",
        repoUrl: "",
        demoUrl: "",
        tags: [],
        images: [],
        status: "draft" as ProjectStatus,
    };

    let title = form?.values?.title ?? initialProject.title;
    let oneLiner = form?.values?.oneLiner ?? initialProject.oneLiner;
    let problemStatement =
        form?.values?.problemStatement ?? initialProject.problemStatement;
    let projectStage =
        (form?.values?.projectStage as ProjectStage | "") ??
        initialProject.projectStage ??
        "";
    let helpTypes = parseDelimitedValues(
        form?.values?.helpTypes ?? initialProject.helpTypes.join(","),
    ) as ProjectHelpType[];
    let helpRequest = form?.values?.helpRequest ?? initialProject.helpRequest;
    let highlightsValue =
        form?.values?.highlights ?? initialProject.highlights.join(",");
    let nextMilestone =
        form?.values?.nextMilestone ?? initialProject.nextMilestone;
    let feedbackRequest =
        form?.values?.feedbackRequest ?? initialProject.feedbackRequest;
    let backgroundNote =
        form?.values?.backgroundNote ?? initialProject.backgroundNote;
    let publicUrl = form?.values?.publicUrl ?? initialProject.publicUrl ?? "";
    let repoUrl = form?.values?.repoUrl ?? initialProject.repoUrl ?? "";
    let demoUrl = form?.values?.demoUrl ?? initialProject.demoUrl ?? "";
    let tagsValue = form?.values?.tags ?? initialProject.tags.join(",");
    let keptImages =
        parseJsonStringArray(form?.values?.keptImagesJson) ?? initialProject.images;
    let uploadedImages: UploadedImage[] = (
        parseJsonStringArray(form?.values?.uploadedImagesJson) ?? []
    ).map((imageUrl) => ({
        id: imageUrl,
        name: imageUrl.split("/").pop() ?? "uploaded.webp",
        size: 0,
        url: imageUrl,
        previewUrl: imageUrl,
        progress: 100,
        status: "uploaded",
        previewIsObjectUrl: false,
    }));
    let localPreparedImages: LocalPreparedImage[] = [];
    let draftProjectId = form?.values?.draftProjectId ?? uploadContext.projectId;
    let screenshotInput: HTMLInputElement | undefined = undefined;
    let isSubmitting = false;
    let isPreparingScreenshots = false;
    let imageMessage = "";
    let uploadedImageUrls: string[] = [];
    const screenshotSizeLimitInMb = Math.floor(
        PROJECT_SCREENSHOT_MAX_SIZE_BYTES / 1024 / 1024,
    );

    function releaseLocalPreparedImages(images: LocalPreparedImage[]) {
        for (const image of images) {
            releasePreparedProjectScreenshotFile(image.previewUrl);
        }
    }

    function releaseUploadedImagePreview(image: UploadedImage) {
        if (image.previewIsObjectUrl) {
            releasePreparedProjectScreenshotFile(image.previewUrl);
        }
    }

    function syncScreenshotInputFiles() {
        if (!browser || !screenshotInput) {
            return;
        }

        const dataTransfer = new DataTransfer();

        for (const image of localPreparedImages) {
            dataTransfer.items.add(image.file);
        }

        screenshotInput.files = dataTransfer.files;
    }

    async function cleanupUploadedImages(imageUrls: string[], quietly = false) {
        if (!browser || imageUrls.length === 0) {
            return;
        }

        try {
            const response = await fetch("/api/uploads/images/cleanup", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    projectId: uploadContext.projectId,
                    imageUrls,
                }),
                keepalive: quietly,
            });

            if (!response.ok && !quietly) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(
                    typeof payload?.message === "string"
                        ? payload.message
                        : "スクリーンショットの cleanup に失敗しました。",
                );
            }
        } catch (error) {
            if (!quietly) {
                imageMessage = toErrorMessage(error);
            }
        }
    }

    function removeKeptImage(imageUrl: string) {
        keptImages = keptImages.filter((currentImageUrl) => currentImageUrl !== imageUrl);
    }

    function removeLocalPreparedImage(imageId: string) {
        const target = localPreparedImages.find((image) => image.id === imageId);

        if (target) {
            releasePreparedProjectScreenshotFile(target.previewUrl);
        }

        localPreparedImages = localPreparedImages.filter(
            (image) => image.id !== imageId,
        );
        syncScreenshotInputFiles();
    }

    async function removeUploadedImage(imageId: string) {
        const target = uploadedImages.find((image) => image.id === imageId);

        if (!target || target.status !== "uploaded") {
            return;
        }

        releaseUploadedImagePreview(target);
        uploadedImages = uploadedImages.filter((image) => image.id !== imageId);
        await cleanupUploadedImages([target.url]);
    }

    async function clearPendingScreenshots() {
        releaseLocalPreparedImages(localPreparedImages);
        localPreparedImages = [];

        for (const image of uploadedImages) {
            releaseUploadedImagePreview(image);
        }

        const imageUrls = uploadedImages
            .filter((image) => image.status === "uploaded")
            .map((image) => image.url);

        uploadedImages = [];
        syncScreenshotInputFiles();
        await cleanupUploadedImages(imageUrls);

        if (screenshotInput) {
            screenshotInput.value = "";
        }
    }

    async function uploadPreparedImages(preparedImages: PreparedProjectScreenshotFile[]) {
        const clientPayload = JSON.stringify({
            scope: "project-screenshot",
            userId: uploadContext.userId,
            projectId: uploadContext.projectId,
        });

        for (const preparedImage of preparedImages) {
            const imageId = crypto.randomUUID();
            const uploadingImage: UploadedImage = {
                id: imageId,
                name: preparedImage.file.name,
                size: preparedImage.file.size,
                url: "",
                previewUrl: preparedImage.previewUrl,
                progress: 0,
                status: "uploading",
                previewIsObjectUrl: true,
            };

            uploadedImages = [...uploadedImages, uploadingImage];

            try {
                const result = await upload(
                    createProjectScreenshotPathname({
                        userId: uploadContext.userId,
                        projectId: uploadContext.projectId,
                    }),
                    preparedImage.file,
                    {
                        access: "public",
                        clientPayload,
                        handleUploadUrl: "/api/uploads/images",
                        onUploadProgress: (event) => {
                            uploadedImages = uploadedImages.map((image) =>
                                image.id === imageId
                                    ? {
                                          ...image,
                                          progress: event.percentage,
                                      }
                                    : image,
                            );
                        },
                    },
                );

                uploadedImages = uploadedImages.map((image) =>
                    image.id === imageId
                        ? {
                              ...image,
                              url: result.url,
                              previewUrl: result.url,
                              progress: 100,
                              status: "uploaded",
                              previewIsObjectUrl: false,
                          }
                        : image,
                );
                releasePreparedProjectScreenshotFile(preparedImage.previewUrl);
            } catch (error) {
                releasePreparedProjectScreenshotFile(preparedImage.previewUrl);
                uploadedImages = uploadedImages.filter((image) => image.id !== imageId);
                throw error;
            }
        }
    }

    async function handleScreenshotSelection(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const rawFiles = input.files ? Array.from(input.files) : [];

        if (rawFiles.length === 0) {
            return;
        }

        imageMessage = "";
        isPreparingScreenshots = true;

        try {
            const currentCount =
                keptImages.length + localPreparedImages.length + uploadedImages.length;

            if (currentCount + rawFiles.length > PROJECT_SCREENSHOT_MAX_COUNT) {
                throw new Error(getImageCountLimitMessage());
            }

            const preparedImages = await prepareProjectScreenshotFiles(rawFiles);

            if (
                keptImages.length +
                    localPreparedImages.length +
                    uploadedImages.length +
                    preparedImages.length >
                PROJECT_SCREENSHOT_MAX_COUNT
            ) {
                for (const image of preparedImages) {
                    releasePreparedProjectScreenshotFile(image.previewUrl);
                }

                throw new Error(getImageCountLimitMessage());
            }

            if (uploadContext.supportsDirectUpload) {
                await uploadPreparedImages(preparedImages);
            } else {
                localPreparedImages = [
                    ...localPreparedImages,
                    ...preparedImages.map((image) => ({
                        id: crypto.randomUUID(),
                        file: image.file,
                        previewUrl: image.previewUrl,
                    })),
                ];
                syncScreenshotInputFiles();
            }
        } catch (error) {
            imageMessage = toErrorMessage(error);
        } finally {
            isPreparingScreenshots = false;
            input.value = "";
        }
    }

    $: selectedStageInfo = getProjectStageInfo(
        projectStage ? (projectStage as ProjectStage) : null,
    );
    $: highlights = parseDelimitedValues(highlightsValue);
    $: tags = parseDelimitedValues(tagsValue);
    $: uploadedImageUrls = uploadedImages
        .filter((image) => image.status === "uploaded")
        .map((image) => image.url);
    $: pendingUploadCount = uploadedImages.filter(
        (image) => image.status === "uploading",
    ).length;
    $: localPendingFiles = localPreparedImages.map((image) => image.file);
    $: publishChecklist = getProjectPublishChecklist({
        highlights,
        nextMilestone,
        feedbackRequest,
        tags,
        publicUrl,
        repoUrl,
        demoUrl,
        images: [
            ...keptImages,
            ...uploadedImageUrls,
            ...localPendingFiles.map((file) => file.name),
        ],
    });
    $: publishReady = publishChecklist.every((item) => item.complete);
    $: keepButtonLabel = getKeepButtonLabel(initialProject.status);
    $: showLegacyPublishedNotice =
        mode === "edit" &&
        initialProject.status === "published" &&
        !publishReady;
    $: if (browser) {
        syncScreenshotInputFiles();
    }

    onMount(() => {
        if (!browser) {
            return;
        }

        const handlePageHide = () => {
            if (isSubmitting || uploadedImageUrls.length === 0) {
                return;
            }

            void cleanupUploadedImages(uploadedImageUrls, true);
        };

        window.addEventListener("pagehide", handlePageHide);

        return () => {
            window.removeEventListener("pagehide", handlePageHide);
        };
    });

    onDestroy(() => {
        releaseLocalPreparedImages(localPreparedImages);

        for (const image of uploadedImages) {
            releaseUploadedImagePreview(image);
        }
    });
</script>

<form
    method="POST"
    enctype="multipart/form-data"
    class="space-y-8"
    on:submit={() => (isSubmitting = true)}
>
    <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="mb-6">
            <p class="text-sm font-bold uppercase tracking-[0.2em] text-indigo-500">
                Step 1
            </p>
            <h2 class="mt-2 text-2xl font-bold text-gray-900">
                まず下書きを作る
            </h2>
            <p class="mt-2 text-sm text-gray-600">
                初見の人が「何を作っていて、どう協力できるか」をつかめる情報だけ先に揃えます。
            </p>
        </div>

        <div class="space-y-5">
            <div class="space-y-2">
                <label class="block text-sm font-bold text-gray-700" for="title">
                    プロジェクト名
                </label>
                <input
                    id="title"
                    name="title"
                    bind:value={title}
                    required={mode === "create"}
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="例: Growth Hach"
                />
            </div>

            <div class="space-y-2">
                <label
                    class="block text-sm font-bold text-gray-700"
                    for="oneLiner"
                >
                    ひとことで何を作っているか
                </label>
                <input
                    id="oneLiner"
                    name="oneLiner"
                    bind:value={oneLiner}
                    required={mode === "create"}
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="例: ハッカソン作品の継続開発を支えるコミュニティ基盤"
                />
                <p class="text-xs text-gray-500">一覧カードで最初に見える一文です。下書きでは短くても保存できます。</p>
            </div>

            <div class="space-y-2">
                <label
                    class="block text-sm font-bold text-gray-700"
                    for="problemStatement"
                >
                    誰のどんな課題を解決するか
                </label>
                <textarea
                    id="problemStatement"
                    name="problemStatement"
                    bind:value={problemStatement}
                    rows="4"
                    class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="誰が困っていて、その人の何をどう良くするのかを具体的に書いてください。"
                ></textarea>
                <p class="text-xs text-gray-500">下書きでは短くても保存できます。公開前に、支援先が伝わる粒度まで整えてください。</p>
            </div>

            <div class="space-y-3">
                <div class="block text-sm font-bold text-gray-700">
                    現在のステージ
                </div>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {#each stageOptions as option}
                        <button
                            type="button"
                            class="rounded-xl border p-4 text-left transition {projectStage === option.value
                                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300'}"
                            on:click={() => (projectStage = option.value)}
                        >
                            <div class="font-bold text-gray-900">{option.label}</div>
                            <p class="mt-2 text-sm text-gray-600">{option.description}</p>
                        </button>
                    {/each}
                </div>
                <input type="hidden" name="projectStage" value={projectStage} />
                <p class="text-xs text-gray-500">{selectedStageInfo.description}</p>
            </div>

            <div class="space-y-2">
                <div class="block text-sm font-bold text-gray-700">
                    今いちばん欲しい協力
                </div>
                <ProjectHelpTypePicker bind:value={helpTypes} />
            </div>

            <div class="space-y-2">
                <label
                    class="block text-sm font-bold text-gray-700"
                    for="helpRequest"
                >
                    協力してほしい具体的な内容
                </label>
                <textarea
                    id="helpRequest"
                    name="helpRequest"
                    bind:value={helpRequest}
                    rows="4"
                    class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="何を見てほしいか、どんな人に来てほしいか、いま止まっているポイントは何かを書いてください。"
                ></textarea>
                <p class="text-xs text-gray-500">下書きでは短くても保存できます。公開前に、何を頼みたいかが伝わる内容に整えてください。</p>
            </div>
        </div>
    </section>

    <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
                <p class="text-sm font-bold uppercase tracking-[0.2em] text-emerald-500">
                    Step 2
                </p>
                <h2 class="mt-2 text-2xl font-bold text-gray-900">
                    公開前チェック
                </h2>
                <p class="mt-2 text-sm text-gray-600">
                    公開時に埋まっていると、第三者が内容を理解しやすく、協力もしやすくなります。
                </p>
            </div>

            <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:w-[21rem]">
                <div class="text-sm font-bold text-gray-900">
                    公開前チェック {publishReady ? "完了" : "未完了"}
                </div>
                <div class="mt-3 space-y-2">
                    {#each publishChecklist as item}
                        <div class="flex items-start gap-2 text-sm">
                            <span
                                class="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold {item.complete
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-rose-100 text-rose-600'}"
                            >
                                {item.complete ? "✓" : "!"}
                            </span>
                            <span class={item.complete ? "text-gray-700" : "text-rose-700"}>
                                {item.label}
                            </span>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        {#if showLegacyPublishedNotice}
            <div class="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                このプロジェクトは公開を維持しています。今のままでも表示は続きますが、未入力の公開前チェックを埋めると協力を得やすくなります。
            </div>
        {/if}

        <div class="space-y-5">
            <div class="space-y-2">
                <label class="block text-sm font-bold text-gray-700" for="highlights">
                    できること・見どころ
                </label>
                <ProjectTagInput
                    id="highlights"
                    name="highlights"
                    bind:value={highlightsValue}
                    maxItems={3}
                    placeholder="例: 相談投稿に固定テンプレを出せる"
                    emptyStateLabel="見どころを追加"
                    helperText="1項目ずつ Enter で追加。5〜60文字の見どころを最大3件まで登録できます。"
                />
            </div>

            <div class="space-y-2">
                <label
                    class="block text-sm font-bold text-gray-700"
                    for="nextMilestone"
                >
                    次のマイルストーン
                </label>
                <input
                    id="nextMilestone"
                    name="nextMilestone"
                    bind:value={nextMilestone}
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="例: 今月中にプロジェクト詳細の更新投稿タブを本実装する"
                />
            </div>

            <div class="space-y-2">
                <label
                    class="block text-sm font-bold text-gray-700"
                    for="feedbackRequest"
                >
                    見てほしい点 / フィードバックが欲しい点
                </label>
                <input
                    id="feedbackRequest"
                    name="feedbackRequest"
                    bind:value={feedbackRequest}
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="例: 相談投稿の導線が直感的かを見てほしい"
                />
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-bold text-gray-700" for="tags">
                    タグ
                </label>
                <ProjectTagInput
                    id="tags"
                    name="tags"
                    bind:value={tagsValue}
                    placeholder="SvelteKit / TypeScript / コミュニティ"
                    emptyStateLabel="タグを追加"
                    helperText="公開時は2〜5件が目安です。入力して Enter で追加できます。"
                />
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="space-y-2">
                    <label
                        class="block text-sm font-bold text-gray-700"
                        for="publicUrl"
                    >
                        公開URL
                    </label>
                    <input
                        id="publicUrl"
                        name="publicUrl"
                        type="url"
                        bind:value={publicUrl}
                        class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="https://example.com"
                    />
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-bold text-gray-700" for="repoUrl">
                        GitHub URL
                    </label>
                    <input
                        id="repoUrl"
                        name="repoUrl"
                        type="url"
                        bind:value={repoUrl}
                        class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="https://github.com/..."
                    />
                </div>
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-bold text-gray-700" for="demoUrl">
                    デモURL
                </label>
                <input
                    id="demoUrl"
                    name="demoUrl"
                    type="url"
                    bind:value={demoUrl}
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="https://demo.example.com"
                />
                <p class="text-xs text-gray-500">
                    公開URL・GitHub URL・デモURL・スクリーンショットのいずれか1つで公開条件を満たせます。
                </p>
            </div>

            <div class="space-y-3">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700" for="screenshots">
                            スクリーンショット
                        </label>
                        <p class="mt-1 text-xs text-gray-500">
                            JPEG / PNG / WebP / HEIC / HEIF を最大{PROJECT_SCREENSHOT_MAX_COUNT}枚、
                            1枚{screenshotSizeLimitInMb}MBまで登録できます。
                        </p>
                    </div>

                    {#if localPreparedImages.length > 0 || uploadedImages.length > 0}
                        <button
                            type="button"
                            class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                            on:click={clearPendingScreenshots}
                        >
                            今回追加分をクリア
                        </button>
                    {/if}
                </div>

                <input
                    bind:this={screenshotInput}
                    id="screenshots"
                    name="screenshots"
                    type="file"
                    multiple
                    accept={PROJECT_SCREENSHOT_FILE_INPUT_ACCEPT}
                    class="block w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-indigo-700"
                    on:change={handleScreenshotSelection}
                />

                <input type="hidden" name="draftProjectId" value={draftProjectId} />
                <input
                    type="hidden"
                    name="keptImagesJson"
                    value={JSON.stringify(keptImages)}
                />
                <input
                    type="hidden"
                    name="uploadedImagesJson"
                    value={JSON.stringify(uploadedImageUrls)}
                />

                {#if imageMessage}
                    <div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {imageMessage}
                    </div>
                {/if}

                {#if keptImages.length > 0}
                    <div class="space-y-2">
                        <div class="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                            登録済み
                        </div>
                        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {#each keptImages as imageUrl, index}
                                <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                    <img
                                        src={imageUrl}
                                        alt={`登録済みスクリーンショット ${index + 1}`}
                                        class="aspect-video w-full object-cover"
                                    />
                                    <div class="flex items-center justify-between gap-3 px-4 py-3">
                                        <div class="text-xs text-gray-500">
                                            スクリーンショット {index + 1}
                                        </div>
                                        <button
                                            type="button"
                                            class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                                            on:click={() => removeKeptImage(imageUrl)}
                                        >
                                            削除
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if uploadedImages.length > 0 || localPreparedImages.length > 0}
                    <div class="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                        <div class="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                            今回追加する画像
                        </div>
                        <div class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {#each uploadedImages as image}
                                <div class="overflow-hidden rounded-2xl border border-indigo-200 bg-white">
                                    <img
                                        src={image.previewUrl}
                                        alt={image.name}
                                        class="aspect-video w-full object-cover"
                                    />
                                    <div class="space-y-2 px-4 py-3">
                                        <div class="flex items-center justify-between gap-3">
                                            <div class="min-w-0 text-xs text-gray-600">
                                                <div class="truncate font-bold text-gray-900">
                                                    {image.name}
                                                </div>
                                                <div>
                                                    {(image.size / 1024 / 1024).toFixed(1)} MB
                                                </div>
                                            </div>
                                            {#if image.status === "uploaded"}
                                                <button
                                                    type="button"
                                                    class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                                                    on:click={() => removeUploadedImage(image.id)}
                                                >
                                                    削除
                                                </button>
                                            {/if}
                                        </div>
                                        {#if image.status === "uploading"}
                                            <div class="space-y-1">
                                                <div class="text-xs font-bold text-indigo-700">
                                                    アップロード中... {Math.round(image.progress)}%
                                                </div>
                                                <div class="h-2 rounded-full bg-indigo-100">
                                                    <div
                                                        class="h-2 rounded-full bg-indigo-500 transition-[width]"
                                                        style={`width: ${image.progress}%`}
                                                    ></div>
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            {/each}

                            {#each localPreparedImages as image}
                                <div class="overflow-hidden rounded-2xl border border-indigo-200 bg-white">
                                    <img
                                        src={image.previewUrl}
                                        alt={image.file.name}
                                        class="aspect-video w-full object-cover"
                                    />
                                    <div class="flex items-center justify-between gap-3 px-4 py-3">
                                        <div class="min-w-0 text-xs text-gray-600">
                                            <div class="truncate font-bold text-gray-900">
                                                {image.file.name}
                                            </div>
                                            <div>
                                                {(image.file.size / 1024 / 1024).toFixed(1)} MB
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                                            on:click={() => removeLocalPreparedImage(image.id)}
                                        >
                                            削除
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <div class="space-y-2">
                <label
                    class="block text-sm font-bold text-gray-700"
                    for="backgroundNote"
                >
                    補足・背景
                </label>
                <textarea
                    id="backgroundNote"
                    name="backgroundNote"
                    bind:value={backgroundNote}
                    rows="5"
                    class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="背景や経緯、補足しておきたい仕様があれば書いてください。"
                ></textarea>
            </div>
        </div>
    </section>

    {#if form?.message}
        <div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {form.message}
        </div>
    {/if}

    <div class="flex flex-wrap items-center gap-3">
        {#if mode === "create"}
            <button
                type="submit"
                name="statusIntent"
                value="draft"
                disabled={isSubmitting || isPreparingScreenshots || pendingUploadCount > 0}
                class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
                {isSubmitting ? "保存中..." : "下書きを作成"}
            </button>
            <button
                type="submit"
                name="statusIntent"
                value="published"
                disabled={isSubmitting || isPreparingScreenshots || pendingUploadCount > 0}
                class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
                {isSubmitting ? "保存中..." : "公開して作成"}
            </button>
        {:else}
            <button
                type="submit"
                name="statusIntent"
                value="keep"
                disabled={isSubmitting || isPreparingScreenshots || pendingUploadCount > 0}
                class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
                {isSubmitting ? "保存中..." : keepButtonLabel}
            </button>

            {#if initialProject.status !== "published"}
                <button
                    type="submit"
                    name="statusIntent"
                    value="published"
                    disabled={isSubmitting || isPreparingScreenshots || pendingUploadCount > 0}
                    class="inline-flex items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    公開する
                </button>
            {/if}

            {#if initialProject.status !== "draft"}
                <button
                    type="submit"
                    name="statusIntent"
                    value="draft"
                    disabled={isSubmitting || isPreparingScreenshots || pendingUploadCount > 0}
                    class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    下書きに戻す
                </button>
            {/if}

            {#if initialProject.status !== "archived"}
                <button
                    type="submit"
                    name="statusIntent"
                    value="archived"
                    disabled={isSubmitting || isPreparingScreenshots || pendingUploadCount > 0}
                    class="inline-flex items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    アーカイブする
                </button>
            {/if}
        {/if}
    </div>
</form>
