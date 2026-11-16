import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    sidebar:false,
    notePopup:false,
    sectionPopup:false,
    studentPopup:false,
    passwordPopup:false
}

const Slice = createSlice({
    name:"portalSlice",
    initialState,
    reducers:{

        toggleSidebar:(state , action) =>{
            if(action && typeof action.payload === "boolean"){
                state.sidebar = action.payload;
            }
            else{
                state.sidebar = !state.sidebar;
            }
        },

        toggleNotePopup:(state) =>{
            state.notePopup = !state.notePopup;
        },

        setSectionPopup:(state , action) =>{
            state.sectionPopup = action.payload;
        },

        setStudentPopup:(state , action) =>{
            state.studentPopup = action.payload;
        },

        setPasswordPopup:(state , action) =>{
            state.passwordPopup = action.payload;
        }

    }
})

export const {toggleSidebar , toggleNotePopup , setSectionPopup , setStudentPopup , setPasswordPopup} = Slice.actions;
export default Slice.reducer;
