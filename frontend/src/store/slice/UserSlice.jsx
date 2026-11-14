import { createSlice } from "@reduxjs/toolkit"

// ---------------------------------------------------------------------------
// A "slice" is one part of the Redux store plus the functions (reducers)
// that are allowed to change it. createSlice also makes an "action" for every
// reducer, e.g. dispatch(setUser(data)) runs the setUser reducer below.
//
// Inside a reducer we can write  state.x = y  directly - Redux Toolkit turns
// it into a safe copy for us behind the scenes.
// ---------------------------------------------------------------------------

const initialState = {
    user:false,              // logged-in user (admin or student) or false
    loginPopup:false,        // AuthPage modal open?        (not persisted)
    loginRole:"student",     // which tab the AuthPage opens on
    slideMenu:false          // mobile menu open?           (not persisted)
}

const Slice = createSlice({
    name:"userSlice",
    initialState,

    reducers:{

        //$ function to open / close the login popup (payload = optional tab to open on)
        toggleLoginPopup:(state , action) =>{
            state.loginPopup = !state.loginPopup;
            if(action && action.payload){
                state.loginRole = action.payload;
            }
        },

        //$ function to open the login popup (payload = optional tab to open on)
        openLoginPopup:(state , action) =>{
            state.loginPopup = true;
            if(action && action.payload){
                state.loginRole = action.payload;
            }
        },

        //$ function to open / close the mobile menu
        toggleSlideMenu:(state) =>{
            state.slideMenu = !state.slideMenu;
        },

        //$ function to save the logged-in user (or false to log out)
        setUser:(state , action) =>{
            state.user = action.payload;
        }

    }

})

export const {toggleLoginPopup , openLoginPopup , toggleSlideMenu , setUser} = Slice.actions;
export default Slice.reducer;
