<script lang="ts">
    import ProjectEditorForm from "$lib/components/projects/ProjectEditorForm.svelte";
    import type { MediaStorageDriver } from "$lib/shared/media/config";
    import { ArrowLeft } from "lucide-svelte";

    export let data: {
        draftProjectId: string;
        mediaUpload: {
            driver: MediaStorageDriver;
            supportsDirectUpload: boolean;
            userId: string;
        };
    };

    export let form:
        | {
              message?: string;
              values?: {
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
          }
        | undefined;
</script>

<div class="max-w-5xl mx-auto py-6">
    <a
        href="/projects"
        class="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
    >
        <ArrowLeft class="h-4 w-4" /> 一覧へ戻る
    </a>

    <section class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">プロジェクトを作成</h1>
        <p class="mt-2 max-w-3xl text-sm text-gray-600">
            作品名だけで終わらせず、「何を作っていて、どう協力してほしいか」が伝わる下書きを先に作ります。公開前チェックはこの画面のまま続けて埋められます。
        </p>
    </section>

    <ProjectEditorForm
        mode="create"
        {form}
        uploadContext={{
            ...data.mediaUpload,
            projectId: form?.values?.draftProjectId ?? data.draftProjectId,
        }}
    />
</div>
