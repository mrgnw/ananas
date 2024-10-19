<script lang="ts">
    import type { PageData } from './$types';
		import NewLang from '$jibs/NewLang.svelte';
    
    export let data: PageDat
    const { PUBLIC_PASSLOCK_TENANCY_ID, PUBLIC_PASSLOCK_CLIENT_ID } = data;
		
    const { onSubmit } = login({ 
        tenancyId: PUBLIC_PASSLOCK_TENANCY_ID, 
        clientId: PUBLIC_PASSLOCK_CLIENT_ID
    })

</script>

<NewLang></NewLang>
