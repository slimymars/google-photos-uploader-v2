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
                // ToDo albumIdの指定なしならアップロード可能。
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
                .find((data) => data.status.message === "OK");
            if (result === undefined) {
                console.log(resp);
            }
            return result !== undefined;
        })
    }
}

export interface AlbumData {
    productUrl: string;
    id: string;
    title: string;
    isWriteable: boolean;
}

export interface RawAlbumList {
    albums: {
        id: string;
        title: string;
    }[];
    nextPageToken: string;
}

interface RawAddItemResponse {
    newMediaItemResults: {
        uploadToken: string;
        status: {
            message: string;
        };
    }[]
}
