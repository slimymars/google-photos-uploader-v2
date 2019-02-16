<template>
    <div id="google_photos">
        <button @click="onClick">Get Album List</button>
        <ul>
            <li v-for="album in albumList" :id="album.id">{{album.title}}</li>
        </ul>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';

    interface RawAlbumList {
        albums: {
            id: string;
            title: string;
        }[];
        nextPageToken: string;
    }

    @Component
    export default class GooglePhotosAlbumList extends Vue {
        public albumList: { id: string; title: string }[] = [];

        private getToken(): Promise<string> {
            // noinspection TypeScriptValidateTypes
            return new Promise<string>((resolve: (value?: string) => void) => {
                chrome.identity.getAuthToken({interactive: true}, token => {
                    resolve(token)
                })
            });
        }

        private getAlbumJson(auth_token: string, next_page_token: string): Promise<RawAlbumList> {
            const query = next_page_token === '' ? '' : '?pageToken=' + next_page_token;
            return fetch("https://photoslibrary.googleapis.com/v1/albums" + query, {
                headers: {
                    "Content-type": "application/json",
                    "Authorization": "Bearer " + auth_token
                }
            }).then(resp => resp.json()).then(result => <RawAlbumList>result)
        }

        public async onClick() {
            this.albumList = [];
            const token = await this.getToken();
            let nextPageToken = '';
            do {
                const json_data = await this.getAlbumJson(token, nextPageToken);
                // console.log(json_data);
                json_data.albums.forEach(value => this.albumList.push({id: value.id, title: value.title}));
                nextPageToken = json_data.hasOwnProperty('nextPageToken') ? json_data.nextPageToken : '';
            } while (nextPageToken !== '');
        }
    }
</script>

<style scoped>

</style>
