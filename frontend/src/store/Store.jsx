import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slice/UserSlice";
import portalReducer from "./slice/PortalSlice";
import { Api } from "./Api/Api";
import storage from "redux-persist/lib/storage";
import {persistReducer , persistStore} from "redux-persist"

// ---------------------------------------------------------------------------
// The Redux "store" = one big object that holds the app's shared data.
// Any component can read it with useSelector() and change it with dispatch().
//
// redux-persist saves part of the store in the browser (localStorage) and loads
// it back when the page is refreshed - so the user stays logged in.
// ---------------------------------------------------------------------------

const userPersistConfig = {
    key: "user",                               // saved in localStorage under "persist:user"
    storage,                                   // storage = localStorage
    blacklist: ["loginPopup", "slideMenu"]     // these are NOT saved (popups should start closed)
};

// the user reducer, wrapped so it is saved / loaded automatically
const userPersist = persistReducer(userPersistConfig, userReducer);


export const store = configureStore({

    // each key here becomes a part of the store: state.user , state.portal , state.api
    reducer:{
        user:userPersist,
        portal:portalReducer,             // popups only -> never persisted
        [Api.reducerPath]:Api.reducer     // RTK Query keeps its loaded data (cache) here
    },

    // middleware = code that runs on every dispatch.
    // serializableCheck is turned off because redux-persist dispatches non-plain values.
    // Api.middleware makes RTK Query's caching and re-loading work.
    middleware:(getDefaultMiddleware) =>
        getDefaultMiddleware({serializableCheck:false}).concat(Api.middleware),
})


// the persistor does the actual saving / loading (used by <PersistGate> in main.jsx)
export const persistor = persistStore(store);
