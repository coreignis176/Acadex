import { createSlice } from "@reduxjs/toolkit";

// every form modal inside the portals is opened / closed from here
// (see UserSlice.jsx for what a "slice" is)
const initialState = {
    sidebar:false,           // mobile sidebar drawer
    notePopup:false,         // upload / submit notes form
    sectionPopup:false,      // add / rename section form  -> false | {mode , ...}
    studentPopup:false,      // register student form      -> false | {sectionId , label}
    passwordPopup:false      // change password form
}

const Slice = createSlice({
    name:"portalSlice",
    initialState,
    reducers:{

        //$ function to open / close the sidebar
        // toggleSidebar(true) opens it, toggleSidebar(false) closes it, toggleSidebar() flips it
        toggleSidebar:(state , action) =>{
            if(action && typeof action.payload === "boolean"){
                state.sidebar = action.payload;
            }
            else{
                state.sidebar = !state.sidebar;
            }
        },

        //$ function to open / close the notes form
        toggleNotePopup:(state) =>{
            state.notePopup = !state.notePopup;
        },

        //$ function to open the section form (payload = its details) or close it (false)
        setSectionPopup:(state , action) =>{
            state.sectionPopup = action.payload;
        },

        //$ function to open the student form (payload = its details) or close it (false)
        setStudentPopup:(state , action) =>{
            state.studentPopup = action.payload;
        },

        //$ function to open / close the change password form
        setPasswordPopup:(state , action) =>{
            state.passwordPopup = action.payload;
        }

    }
})

export const {toggleSidebar , toggleNotePopup , setSectionPopup , setStudentPopup , setPasswordPopup} = Slice.actions;
export default Slice.reducer;
