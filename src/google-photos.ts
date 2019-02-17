export class GooglePhotos {
    static getAlbumJson(auth_token: string, next_page_token: string): Promise<RawAlbumList> {
        const query = next_page_token === '' ? '' : '?pageToken=' + next_page_token;
        return fetch("https://photoslibrary.googleapis.com/v1/albums" + query, {
            headers: {
                "Content-type": "application/json",
                "Authorization": "Bearer " + auth_token
            }
        }).then(resp => resp.json()).then(result => <RawAlbumList>result)
    }

    static uploadImage(auth_token: string, albumId: string, imageUrl: string): Promise<boolean> {
        console.log('albumId', albumId);
        console.log('imageUrl', imageUrl);
        return Promise.resolve(true);
    }
}

export interface RawAlbumList {
    albums: {
        id: string;
        title: string;
    }[];
    nextPageToken: string;
}
