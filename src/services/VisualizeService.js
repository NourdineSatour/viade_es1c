import auth from 'solid-auth-client';
import FC from 'solid-file-client';

/*
    *****************************************
    *                                       *
    *   FOLLOWING THE SPECIFICATION V1.1    *
    *                                       *
    * ***************************************
*/

export default class VisualizeService{
    constructor(HTMLElement){
        this.points = [];
        this.elevationsValues = [];
        this.urlRouteInPod = null;
        this.routes = [];
        this.extension = null;
        this.session = null;
        this.warning = null;
        this.success = null;
        this.error = null;
        this.errorLoad = null;
        this.existsMultimedia = true;
        this.existsVideo = false;
        this.existsImage = false;
        this.HTMLElement = HTMLElement;
        this.images = [];
        this.permissionsImage = false;
        this.permissionsVideo = false;
        this.videos = [];
        this.permission = null;
    }

    /**
     * Method that returns my tracks stored in pod
     */
    async getMyRoutesFromPod() {
        await this.getSession("viade/routes/");
        const fc = new FC(auth);
        try {
            this.content = await fc.readFolder(this.urlRouteInPod, null);
            await this.getRoutesNames(this.content);
        } catch (SFCFetchError) {
            this.errorLoad = "Error al cargar combo";
        }
    }

    /**
     * Method that returns shared tracks stored in pod
     */
    async getSharedRoutesFromPod() {
        await this.getSession("public/share/");
        const fc = new FC(auth);
        try {
            this.content = await fc.readFolder(this.urlRouteInPod, null);
            await this.getRoutesNames(this.content);
        } catch (SFCFetchError) {
            this.errorLoad = "Error al cargar combo";
        }
    }

    /**
     * Aux method to return the session with it's logged in.
     */
    async getSession(route){
        await auth.trackSession(session => {
            if (!session){
                return;
            } else {
                this.session = session;
            }
        })
        await this.getSessionId(route, this.session);
    }

    /**
     * Aux method that return the webId of the user who is logged in.
     * @param {current session} session 
     */
    async getSessionId(route, session) {
        let webId = session.webId;
        await this.getPodRoute(route, webId);
    }

    /**
     * Aux method that returns the route to tracks upload in the pod.
     * @param {logged in user's webId} webId 
     */
    async getPodRoute(route, webId) {
        /*
            15 == length("profile/card#me")
            "viade/routes/" == folder where the routes are stored
        */
        this.urlRouteInPod = webId.slice(0, webId.length - 15).concat(route);
        if (this.HTMLElement != null){
            let selectedRouteName = this.HTMLElement.value.concat(".json");
            this.urlRouteInPod = this.urlRouteInPod.concat(selectedRouteName);
        }
    }

    /**
     * Aux method that extracts track's name without extension
     * @param {content of readFile} content 
     */
    async getRoutesNames(content) {
        if (content.files.length === 0) {
            this.warning = "No hay contenido";
        } else {
            for (let i = 0; i < content.files.length; i++) {
                this.extension = content.files[i].name.split(".");
                if (this.extension[1].localeCompare("json") === 0) {
                    // 5 == length(".json")
                    this.routes.push(content.files[i].name.slice(0, content.files[i].name.length - 5));
                }
            }
            this.success = "Cargo rutas";
        }
    }

    /**
     * Method that assign the points to print the track in the map
     */
    async fillMap(selectedFilter){
        if (selectedFilter.localeCompare("Mis rutas") === 0) {
            await this.getSession("viade/routes/");
        } else if (selectedFilter.localeCompare("Compartidas") === 0) {
            await this.getSession("public/share/");
        }
        const fc = new FC(auth);
        try{
            this.content = await fc.readFile(this.urlRouteInPod, null);
            await this.getPointsToPrint(this.content); 
        } catch (SFCFetchError){
            this.error = "Error al pillar datos";
        }
    }

    /**
     * Aux method to check read permissions
     * @returns {Promise<boolean>}
     */
    readPermission(url) {
        let req = new XMLHttpRequest();
        req.open("GET", url, false);
        req.send(null);
    }

    /**
     * Aux method to extract points and elevations from track
     * @param {track's content} content 
     */
    async getPointsToPrint(content) {
        let route = JSON.parse(content);
    
        // We obtain the points of the route
        let numberOfPoints = route.points.length;
        for (let i = 0; i < numberOfPoints; i++) {

            let latitude = route.points[i].latitude;
            let longitude = route.points[i].longitude;
            this.points.push([latitude, longitude]);

            let elevation = route.points[i].elevation;
            this.elevationsValues.push({ x: 'P'.concat(i+1), y: parseInt(elevation, 10)});
        }
        await this.getMultimedia(route);
    }

    /**
     * Aux method to obtain images from track
     * @param route - track
     * @returns {Promise<void>}
     */
    async getMultimedia(route) {
        // We obtain the images of the track
        if (route.media !== undefined && route.media.length > 0) {
                for (let media in route.media) {
                    let routeMedia = route.media[media]["@id"];
                    let extensionRoute = routeMedia.split(".");
                    let extension = ".".concat(extensionRoute[extensionRoute.length - 1]);
                    if ((extension.localeCompare(".jpg") === 0) || (extension.localeCompare(".png") === 0)) {
                        try {
                            this.existsImage = true;
                            let permissionRoute = routeMedia.replace("/routeMedia/image/*", "/card#me");
                            await this.readPermission(permissionRoute);
                            this.permissionsImage = true;
                            this.images.push(routeMedia);
                        } catch (e) {
                            this.permissionsImage = false;
                        }
                    } else if (extension.localeCompare(".mp4") === 0) {
                        try {
                            this.existsVideo = true;
                            let permissionRoute = routeMedia.replace("/routeMedia/image/*", "/card#me");
                            await this.readPermission(permissionRoute);
                            this.permissionsVideo = true;
                            this.videos.push(routeMedia);
                        } catch (e) {
                            this.permissionsVideo = false;
                        }
                    }
                }
        } else {
            this.existsMultimedia = false;
        }
    }
}