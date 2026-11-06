<script lang="ts">
  import { base } from '$app/paths';
</script>

<section class="px-6 pb-16">
  <div class="mx-auto max-w-3xl">
    <video
      class="block w-full rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
      src="{base}/brag.mp4"
      poster="{base}/brag.jpg"
      controls
      playsinline
      preload="none"
    >
      <track kind="captions" src="{base}/brag.vtt" srclang="en" label="English" />
    </video>
  </div>
</section>
