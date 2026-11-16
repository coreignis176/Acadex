import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slice/UserSlice";
import portalReducer from "./slice/PortalSlice";
import { Api } from "./Api/Api";
import storage from "redux-persist/lib/storage";
import {persistReducer , persistStore} from "redux-persist"

const userPersistConfig = {
    key: "user",
    storage,
    blacklist: ["loginPopup", "slideMenu"]
};

const userPersist = persistReducer(userPersistConfig, userReducer);

export const store = configureStore({

    reducer:{
        user:userPersist,
        portal:portalReducer,
        [Api.reducerPath]:Api.reducer
    },

    middleware:(getDefaultMiddleware) =>
        getDefaultMiddleware({serializableCheck:false}).concat(Api.middleware),
})

export const persistor = persistStore(store);
