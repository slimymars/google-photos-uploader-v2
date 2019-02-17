<template>
    <div id="google_photos">
        <button @click="onClick" v-bind:disabled="albumBtnDisabled">{{ albumBtnMsg }}</button>
        <label for="album-selector">アルバムリスト：</label>
        <select v-model="selected" v-bind:disabled="albumListDisabled" id="album-selector">
            <option disabled :value="''">{{ msg }}</option>
            <option v-for="album in albumList" :value="{id: album.id, title: album.title}">{{ album.title}}</option>
        </select>
        <button @click="addBtn" v-bind:disabled="addBtnDisabled">追加</button>
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
        public msg = "アルバムリスト取得ボタンで取得してください";
        public selected: { id: string; title: string } | string = "";
        albumBtnDisabled = false;
        addBtnDisabled = true;
        albumListDisabled = true;
        albumBtnMsg = "アルバムリスト取得";

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
            this.albumBtnDisabled = true;
            this.albumBtnMsg = "取得中";
            this.selected = '';
            this.albumListDisabled = true;
            this.addBtnDisabled = true;
            this.albumList = [];
            const token = await this.getToken();
            let nextPageToken = '';
            do {
                const json_data = await this.getAlbumJson(token, nextPageToken);
                // console.log(json_data);
                json_data.albums.forEach(value => this.albumList.push({id: value.id, title: value.title}));
                nextPageToken = json_data.hasOwnProperty('nextPageToken') ? json_data.nextPageToken : '';
            } while (nextPageToken !== '');
            this.albumBtnMsg = "アルバムリスト再取得";
            this.albumBtnDisabled = false;
            this.albumListDisabled = false;
            this.addBtnDisabled = false;
            this.msg = "追加するアルバムを選択してください";
        }

        public addBtn() {
            if (typeof this.selected === 'string') {
                console.log("why call?")
            } else {
                this.$emit('add-btn', this.selected)
            }
        }

    }
</script>

<style scoped>

</style>
