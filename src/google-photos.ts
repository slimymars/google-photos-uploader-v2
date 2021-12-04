export class GooglePhotos {
    static readonly UPLOAD_URL = 'https://photoslibrary.googleapis.com/v1/uploads';
    static readonly COMMIT_URL = 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate';
    static readonly ALBUM_URL = 'https://photoslibrary.googleapis.com/v1/albums';

    static createAlbum(auth_token: string, albumName: string): Promise<AlbumData> {
        const bodyData = {
            "album": {
                "title": albumName
            }
        };
        return fetch(this.ALBUM_URL, {
            headers: {
                "Content-type": "application/json",
                "Authorization": "Bearer " + auth_token
            },
            method: "POST",
            body: JSON.stringify(bodyData)
        }).then((res) => {
            if (res.ok) return res.json();
            throw res;
        });
    }

    static getItemListInAlbumOnePage(auth_token: string, albumId: string, nextPageToken?: string): Promise<MediaItemsSearchResp> {
        const url = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';
        let body: { 'albumId': string; 'pageToken'?: string; 'pageSize': number } = {
            "albumId": albumId,
            'pageSize': 100
        };
        if (nextPageToken !== undefined) body['pageToken'] = nextPageToken;
        return fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                "Content-type": 'application/json',
                'Authorization': 'Bearer ' + auth_token
            }
        }).then(resp => {
            if (resp.ok) return resp.json();
            throw ['get item list err', resp]
        }).then(json => {
            if (!isMediaItemsSearchResp(json)) throw ['get item list body err', json];
            return json;
        })
    }

    static async getItemListInAlbum(auth_token: string, albumId: string, loggerFunc?: (arg: string) => void): Promise<MediaItem[]> {
        let result: MediaItem[] = [];
        let resp: MediaItemsSearchResp;
        let nextPageToken: string | undefined = undefined;
        let page = 1;
        if (loggerFunc === undefined) loggerFunc = () => {
        };
        do {
            loggerFunc('get page ' + page);
            if (nextPageToken === undefined || nextPageToken === "") {
                resp = await this.getItemListInAlbumOnePage(auth_token, albumId)
            } else {
                resp = await this.getItemListInAlbumOnePage(auth_token, albumId, nextPageToken)
            }
            resp.mediaItems.forEach(item => result.push(item));
            nextPageToken = resp.nextPageToken;
            page++;
        } while (nextPageToken !== undefined && nextPageToken !== '');
        return result;
    }

    static async diffAlbum(auth_token: string, albumId_a: string, albumId_b: string, loggerFunc?: (arg: string) => void)
        : Promise<{ AOnly: MediaItem[]; BOnly: MediaItem[] }> {
        if (loggerFunc === undefined) loggerFunc = () => {
        };
        let a_only: MediaItem[] = [];
        loggerFunc("get a");
        const a = await this.getItemListInAlbum(auth_token, albumId_a, loggerFunc);
        loggerFunc("album a count: " + a.length);
        loggerFunc("get b");
        let b = await this.getItemListInAlbum(auth_token, albumId_b, loggerFunc);
        loggerFunc("album b count: " + b.length);
        a.forEach(item => {
            const b_index = b.findIndex((elm) => elm.id === item.id);
            if (b_index === -1) {
                a_only.push(item);
            } else {
                b.splice(b_index, 1)
            }
        });
        return {AOnly: a_only, BOnly: b}
    }

    static copyAlbum(auth_token: string, src_id: string, dist_id: string, updateMsgFunc?: (arg: string) => void): Promise<void> {
        const logger = updateMsgFunc || function (arg: string) {
        };
        logger("token: " + auth_token);
        logger("src_id: " + src_id);
        logger("dist_id: " + dist_id);
        return Promise.reject('まだ実装してません')
    }
    static getAlbumJson(auth_token: string, next_page_token: string): Promise<RawAlbumList> {
        const query = next_page_token === '' ? '' : '?pageToken=' + next_page_token;
        return fetch(this.ALBUM_URL + query, {
            headers: {
                "Content-type": "application/json",
                "Authorization": "Bearer " + auth_token
            }
        }).then(resp => resp.json()).then(result => <RawAlbumList>result)
    }

    static uploadImage(auth_token: string, albumId: string, imageUrl: string): Promise<boolean> {
        console.log('albumId', albumId);
        console.log('imageUrl', imageUrl);
        const fileName = imageUrl.slice(imageUrl.lastIndexOf("/") + 1);
        console.log('filename', fileName);
        let uploadToken = '';

        return fetch(imageUrl, {
            credentials: 'include',
            redirect: "follow",

        }).then((resp) => {
            if (resp.ok) return resp.blob();
            resp.text().then((err) => console.log('image get err body text', err));
            throw resp
        }).then((blob) => {
            return fetch(this.UPLOAD_URL, {
                headers: {
                    "Authorization": "Bearer " + auth_token,
                    "Content-type": "application/octet-stream",
                    "X-Goog-Upload-File-Name": fileName,
                    "X-Goog-Upload-Protocol": "raw"
                },
                method: "POST",
                body: blob
            })
        }).then((resp) => {
            if (resp.ok) return resp.text();
            resp.json().then((obj) => console.log("upload err body", obj));
            throw resp
        }).then((tk) => {
            console.log("upload token", tk);
            uploadToken = tk;
            const upObj = {
                "albumId": albumId,
                "newMediaItems": [
                    {
                        "description": imageUrl,
                        "simpleMediaItem": {
                            "uploadToken": uploadToken
                        }
                    }
                ]
            };
            return fetch(this.COMMIT_URL, {
                headers: {
                    "Content-type": "application/json",
                    "Authorization": "Bearer " + auth_token,
                },
                method: "POST",
                body: JSON.stringify(upObj)
            })
        }).then((resp) => {
            if (resp.ok) return resp.json();
            // だめだったときはalbumIdの指定なしでリトライ。writableでないことが原因の可能性大なので。
            console.log("upload faild. album id nothing retry");
            const upObj = {
                "newMediaItems": [
                    {
                        "description": imageUrl,
                        "simpleMediaItem": {
                            "uploadToken": uploadToken
                        }
                    }
                ]
            };
            return fetch(this.COMMIT_URL, {
                headers: {
                    "Content-type": "application/json",
                    "Authorization": "Bearer " + auth_token,
                },
                method: "POST",
                body: JSON.stringify(upObj)
            }).then((resp) => {
                if (resp.ok) return resp.json();
                resp.json().then((obj) => console.log("commit err body", obj));
                throw resp
            });
        }).then(resp => <RawAddItemResponse>resp
        ).then((resp) => {
            const result = resp.newMediaItemResults.filter((data) => data.uploadToken === uploadToken)
                .find((data) => data.mediaItem !== undefined);
            if (result === undefined) {
                console.log("result not valid");
                console.log(resp);
            }
            return result !== undefined;
        })
    }
}

export interface AlbumData {
    id: string;
    title: string;
    isWriteable: boolean;
    mediaItemsCount: string;
}

export interface RawAlbumList {
    albums: {
        id: string;
        title: string;
        isWriteable?: boolean;
        mediaItemsCount: string;
    }[];
    nextPageToken: string;
}

interface RawAddItemResponse {
    newMediaItemResults: {
        uploadToken: string;
        status: {
            message: string;
        };
        mediaItem?: MediaItem;
    }[]
}

// 必要なもののみ抜粋
export interface MediaItem {
    id: string;
    description: string;
    productUrl: string;
    baseUrl: string;
    mimeType: string;
    filename: string;
}

function isMediaItem(obj: any): obj is MediaItem {
    return obj.hasOwnProperty('id') && obj.hasOwnProperty('description')
}

interface MediaItemsSearchResp {
    mediaItems: MediaItem[];
    nextPageToken?: string;
}

function isMediaItemsSearchResp(obj: any): obj is MediaItemsSearchResp {
    return obj.hasOwnProperty('mediaItems')
}
