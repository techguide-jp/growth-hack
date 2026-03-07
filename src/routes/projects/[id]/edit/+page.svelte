<script lang="ts">
    import ProjectEditorForm from "$lib/components/projects/ProjectEditorForm.svelte";
    import type { MediaStorageDriver } from "$lib/shared/media/config";
    import type { ProjectFormSubmissionState } from "$lib/shared/project-form";
    import type {
        ProjectHelpType,
        ProjectStage,
        ProjectStatus,
    } from "$lib/shared/domain";
    import { ArrowLeft } from "lucide-svelte";

    export let data: {
        project: {
            id: string;
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
        mediaUpload: {
            driver: MediaStorageDriver;
            supportsDirectUpload: boolean;
            userId: string;
        };
    };

    export let form: ProjectFormSubmissionState | undefined;
</script>

<div class="max-w-5xl mx-auto py-6">
    <a
        href="/projects/{data.project.id}"
        class="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
    >
        <ArrowLeft class="h-4 w-4" /> 詳細へ戻る
    </a>

    <section class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">プロジェクトを編集</h1>
        <p class="mt-2 max-w-3xl text-sm text-gray-600">
            初見の人が理解しやすく、協力しやすい見せ方に整えます。公開前チェックが未完了でも、下書き保存や既存公開の維持はできます。
        </p>
    </section>

    <ProjectEditorForm
        mode="edit"
        {form}
        project={data.project}
        uploadContext={{
            ...data.mediaUpload,
            projectId: data.project.id,
        }}
    />
</div>
