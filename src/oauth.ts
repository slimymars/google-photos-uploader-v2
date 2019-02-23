export default class OAuth2 {
    private static _me: OAuth2;

    private constructor() {
    };

    private static REDIRECT_URL = chrome.identity.getRedirectURL();
    private static VALIDATION_BASE_URL = 'https://www.googleapis.com/oauth2/v4/token';

    private clientSecret: WebTypeClientSecret | undefined;

    private loadClientSecret(): Promise<void> {
        if (this.clientSecret) return Promise.resolve();
        const url = chrome.runtime.getURL('./client_secret.json');
        return fetch(url).then(result => result.json())
            .then(json => {
                if (isWebTypeClientSecret(json)) {
                    this.clientSecret = json;
                    return;
                } else {
                    console.log('get secret err', json);
                    throw 'get secret err'
                }
            })
    }

    private getAuthUrl(): string {
        if (!this.clientSecret) throw 'client secret not load';
        const s = this.clientSecret;
        const m = chrome.runtime.getManifest();
        if (m.oauth2 === undefined || m.oauth2.scopes === undefined) throw 'oauth2.scope is none in manifest';
        return `https://accounts.google.com/o/oauth2/auth\
?client_id=${s.web.client_id}\
&response_type=code\
&redirect_uri=${encodeURIComponent(OAuth2.REDIRECT_URL)}\
&scope=${encodeURIComponent(m.oauth2.scopes.join(' '))}`;
    }

    private static extractCode(redirectUri: string): string | null {
        const m = redirectUri.match(/[#?](.*)/);
        if (!m || m.length < 1)
            return null;
        const p = m[1];
        if (typeof p !== 'string') return null;
        const params = new URLSearchParams(p.split("#")[0]);
        return params.get("code");
    }

    private authorize(): Promise<string> {
        const authUrl = this.getAuthUrl();
        return new Promise<string>(resolve => {
            chrome.identity.launchWebAuthFlow({
                interactive: true,
                url: authUrl
            }, resolve)
        }).then((redirectURL) => {
            if (redirectURL === undefined) throw 'Authorization failure: ' + chrome.runtime.lastError;
            const code = OAuth2.extractCode(redirectURL);
            if (!code) {
                console.log('redirectURL err', redirectURL);
                throw "Authorization failure";
            }
            return code;
        });
    }


    private getAccessToken(authInfoOrCode: string | AuthInfo): Promise<AuthInfo> {
        const code = typeof authInfoOrCode === 'string' ? authInfoOrCode : authInfoOrCode.code;
        if (!this.clientSecret) throw 'client secret undefined';
        const s = this.clientSecret;
        let respTime: number;
        const params = new URLSearchParams();
        params.append('code', code);
        params.append('client_id', s.web.client_id);
        params.append('client_secret', s.web.client_secret);
        params.append('redirect_uri', OAuth2.REDIRECT_URL);
        params.append('grant_type', 'authorization_code');
        return fetch(OAuth2.VALIDATION_BASE_URL, {
            method: "POST",
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then((resp) => {
            if (resp.ok) {
                respTime = Date.now();
                return resp.json();
            }
            resp.json().then(d => console.log('get token err', d));
            throw 'get token err'
        }).then(data => {
            if (isAuthResp(data) === false) {
                console.log('get token err json', data);
                throw 'get token err';
            }
            // console.log('auth response data', data);
            return <AuthInfo>{
                code: code,
                access_token: data.access_token,
                token_type: data.token_type,
                expiration: respTime + data.expires_in * 1000
            }
        });
    }

    private static getInstance(): OAuth2 {
        if (this._me === undefined) this._me = new OAuth2();
        return this._me;
    }

    public static getAccessToken(authInfo: AuthInfo | undefined, newAuthSaveFunc: (arg: AuthInfo) => Promise<AuthInfo>): Promise<string> {
        // console.log("auth info", authInfo);
        const me = this.getInstance();
        if (authInfo !== undefined && authInfo.expiration > Date.now()) {
            return Promise.resolve(authInfo.access_token)
        }
        return me.loadClientSecret().then(() => me.authorize()).then((code) => me.getAccessToken(code)).then(newAuthSaveFunc).then(auth => auth.access_token)
    }
}

export interface AuthInfo {
    access_token: string;
    expiration: number;
    token_type: string;
    code: string;
}

interface AuthResp {
    "access_token": string;
    "expires_in": number;
    "token_type": 'Bearer';
}

function isAuthResp(obj: any): obj is AuthResp {
    return obj.hasOwnProperty('token_type') && obj.token_type === 'Bearer';
}

interface WebTypeClientSecret {
    "web": {
        "client_id": string;
        "project_id": string;
        "auth_uri": string;
        "token_uri": string;
        "auth_provider_x509_cert_url": string;
        "client_secret": string;
        "redirect_uris": string[];
    }
}

function isWebTypeClientSecret(obj: any): obj is WebTypeClientSecret {
    return obj.hasOwnProperty('web') && obj.web.hasOwnProperty('client_id');

}
