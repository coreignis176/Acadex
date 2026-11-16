import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    user:false,
    loginPopup:false,
    loginRole:"student",
    slideMenu:false
}

const Slice = createSlice({
    name:"userSlice",
    initialState,

    reducers:{

        toggleLoginPopup:(state , action) =>{
            state.loginPopup = !state.loginPopup;
            if(action && action.payload){
                state.loginRole = action.payload;
            }
        },

        openLoginPopup:(state , action) =>{
            state.loginPopup = true;
            if(action && action.payload){
                state.loginRole = action.payload;
            }
        },

        toggleSlideMenu:(state) =>{
            state.slideMenu = !state.slideMenu;
        },

        setUser:(state , action) =>{
            state.user = action.payload;
        }

    }

})

export const {toggleLoginPopup , openLoginPopup , toggleSlideMenu , setUser} = Slice.actions;
export default Slice.reducer;
