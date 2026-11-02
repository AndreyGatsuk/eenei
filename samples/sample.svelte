<script lang="ts">
  let name = $state("Navigate");
  let active = $state(true);
</script>

<!-- Control flow, event handlers and embedded expressions. -->
{#if active}
  <button onclick={() => active = false}>{name}</button>
{:else}
  <p>No active project</p>
{/if}

<style>
  button { color: var(--accent); }
</style>
