<template>
    <div id="options">
        <GooglePhotosAlbumList></GooglePhotosAlbumList>
    </div>
</template>

<script lang="ts">
    import GooglePhotosAlbumList from './google-photos-album.vue';
    import {Vue, Component} from 'vue-property-decorator';

    @Component({
        components: {
            GooglePhotosAlbumList
        },
    })
    export default class Options extends Vue {

    }

</script>

<style>

</style>
