import { createApi , fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setUser } from "../slice/UserSlice";

const base_url = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9999").trim().replace(/\/+$/ , "");

const API_URL = {
    login:`${base_url}/user/login`,
    logout:`${base_url}/user/logout`,
    getme:`${base_url}/user/getme`,
    changepassword:`${base_url}/user/changepassword`,
    respondcr:`${base_url}/student/respondcr`,

    getadminstats:`${base_url}/admin/getadminstats`,
    getstructure:`${base_url}/admin/getstructure`,
    addsection:`${base_url}/admin/addsection`,
    renamesection:`${base_url}/admin/renamesection`,
    archivesection:`${base_url}/admin/archivesection`,
    getsection:(id) => `${base_url}/admin/getsection/${id}`,
    addstudent:`${base_url}/admin/addstudent`,
    updatestudent:`${base_url}/admin/updatestudent`,
    removestudent:`${base_url}/admin/removestudent`,
    getallstudents:`${base_url}/admin/getallstudents`,
    resetpassword:`${base_url}/admin/resetpassword`,
    selectcr:`${base_url}/admin/selectcr`,
    removecr:`${base_url}/admin/removecr`,
    addsubject:`${base_url}/admin/addsubject`,
    updatesubject:`${base_url}/admin/updatesubject`,
    removesubject:`${base_url}/admin/removesubject`,
    copysubjects:`${base_url}/admin/copysubjects`,

    getsubjects:`${base_url}/notes/getsubjects`,
    getsubjectlist:`${base_url}/notes/getsubjectlist`,
    getnotes:`${base_url}/notes/getnotes`,
    getmysubmissions:`${base_url}/notes/getmysubmissions`,
    submitnote:`${base_url}/notes/submitnote`,
    reactnote:`${base_url}/notes/reactnote`,
    viewnote:`${base_url}/notes/viewnote`,
    getrecent:`${base_url}/notes/getrecent`,
    clearrecent:`${base_url}/notes/clearrecent`,

    getsectionnotes:`${base_url}/cr/getsectionnotes`,
    reviewnote:`${base_url}/cr/reviewnote`,
    deletenote:(id) => `${base_url}/cr/deletenote/${id}`,
    getcrstats:`${base_url}/cr/getcrstats`,

    getnotifications:`${base_url}/notification/getnotifications`,
    marknotificationsread:`${base_url}/notification/markread`
}

const baseQuery = fetchBaseQuery({credentials:"include"});

const baseQueryWithChecks = async(args , api , extraOptions) =>{
    const result = await baseQuery(args , api , extraOptions);

    if(result.error){
        const status = result.error.status;
        const body = result.error.data;

        if(status === 401){
            api.dispatch(setUser(false));
        }

        if(status === 403 && body && body.data && body.data.mustChangePassword){
            const user = api.getState().user.user;
            if(user){
                const updatedUser = Object.assign({} , user);
                updatedUser.mustChangePassword = true;
                api.dispatch(setUser(updatedUser));
            }
        }
    }

    return result;
}

const ALL = ["user" , "structure" , "students" , "notes" , "notifications" , "recent"];

export const Api = createApi({
    baseQuery:baseQueryWithChecks,
    tagTypes:ALL,

    endpoints:(builder) =>({

        login:builder.mutation({
            query:(data) => ({url:API_URL.login , method:"POST" , body:data}),
            invalidatesTags:ALL
        }),
        logout:builder.mutation({
            query:() => ({url:API_URL.logout , method:"POST"})
        }),
        getme:builder.query({
            query:() => ({url:API_URL.getme , method:"GET"}),
            providesTags:["user"]
        }),
        changepassword:builder.mutation({
            query:(data) => ({url:API_URL.changepassword , method:"POST" , body:data}),
            invalidatesTags:["user"]
        }),
        respondcr:builder.mutation({
            query:(data) => ({url:API_URL.respondcr , method:"POST" , body:data}),
            invalidatesTags:["user" , "notifications"]
        }),

        getadminstats:builder.query({
            query:() => ({url:API_URL.getadminstats , method:"GET"}),
            providesTags:["structure" , "students" , "notes"]
        }),
        getstructure:builder.query({
            query:() => ({url:API_URL.getstructure , method:"GET"}),
            providesTags:["structure" , "students"]
        }),
        addsection:builder.mutation({
            query:(data) => ({url:API_URL.addsection , method:"POST" , body:data}),
            invalidatesTags:["structure" , "notifications"]
        }),
        renamesection:builder.mutation({
            query:(data) => ({url:API_URL.renamesection , method:"POST" , body:data}),
            invalidatesTags:["structure" , "students" , "notifications"]
        }),
        archivesection:builder.mutation({
            query:(data) => ({url:API_URL.archivesection , method:"POST" , body:data}),
            invalidatesTags:["structure"]
        }),
        getsection:builder.query({
            query:(data) => ({url:API_URL.getsection(data.sectionId) , method:"GET"}),
            providesTags:["students"]
        }),
        addstudent:builder.mutation({
            query:(data) => ({url:API_URL.addstudent , method:"POST" , body:data}),
            invalidatesTags:["structure" , "students"]
        }),
        updatestudent:builder.mutation({
            query:(data) => ({url:API_URL.updatestudent , method:"POST" , body:data}),
            invalidatesTags:["students" , "notes"]
        }),
        removestudent:builder.mutation({
            query:(data) => ({url:API_URL.removestudent , method:"POST" , body:data}),
            invalidatesTags:["structure" , "students" , "notifications"]
        }),
        getallstudents:builder.query({
            query:() => ({url:API_URL.getallstudents , method:"GET"}),
            providesTags:["students"]
        }),
        resetpassword:builder.mutation({
            query:(data) => ({url:API_URL.resetpassword , method:"POST" , body:data}),
            invalidatesTags:["students"]
        }),
        selectcr:builder.mutation({
            query:(data) => ({url:API_URL.selectcr , method:"POST" , body:data}),
            invalidatesTags:["structure" , "students"]
        }),
        removecr:builder.mutation({
            query:(data) => ({url:API_URL.removecr , method:"POST" , body:data}),
            invalidatesTags:["structure" , "students" , "notifications"]
        }),
        addsubject:builder.mutation({
            query:(data) => ({url:API_URL.addsubject , method:"POST" , body:data}),
            invalidatesTags:["students" , "structure" , "user"]
        }),
        updatesubject:builder.mutation({
            query:(data) => ({url:API_URL.updatesubject , method:"POST" , body:data}),
            invalidatesTags:["students" , "structure" , "user" , "notes"]
        }),
        removesubject:builder.mutation({
            query:(data) => ({url:API_URL.removesubject , method:"POST" , body:data}),
            invalidatesTags:["students" , "structure" , "user"]
        }),
        copysubjects:builder.mutation({
            query:(data) => ({url:API_URL.copysubjects , method:"POST" , body:data}),
            invalidatesTags:["students" , "structure" , "user"]
        }),

        getsubjects:builder.query({
            query:() => ({url:API_URL.getsubjects , method:"GET"}),
            providesTags:["user"]
        }),
        getsubjectlist:builder.query({
            query:() => ({url:API_URL.getsubjectlist , method:"GET"}),
            providesTags:["user"]
        }),
        getnotes:builder.query({
            query:(options) => ({url:API_URL.getnotes , method:"GET" , params:options}),
            providesTags:["notes"]
        }),
        getmysubmissions:builder.query({
            query:() => ({url:API_URL.getmysubmissions , method:"GET"}),
            providesTags:["notes"]
        }),
        submitnote:builder.mutation({
            query:(data) => ({url:API_URL.submitnote , method:"POST" , body:data}),
            invalidatesTags:["notes"]
        }),
        reactnote:builder.mutation({
            query:(data) => ({url:API_URL.reactnote , method:"POST" , body:data}),
            invalidatesTags:["notes"]
        }),

        viewnote:builder.mutation({
            query:(data) => ({url:API_URL.viewnote , method:"POST" , body:data}),
            invalidatesTags:["recent"]
        }),
        getrecent:builder.query({
            query:() => ({url:API_URL.getrecent , method:"GET"}),
            providesTags:["recent" , "notes"]
        }),
        clearrecent:builder.mutation({
            query:() => ({url:API_URL.clearrecent , method:"POST"}),
            invalidatesTags:["recent"]
        }),

        getsectionnotes:builder.query({
            query:() => ({url:API_URL.getsectionnotes , method:"GET"}),
            providesTags:["notes"]
        }),
        reviewnote:builder.mutation({
            query:(data) => ({url:API_URL.reviewnote , method:"POST" , body:data}),
            invalidatesTags:["notes" , "notifications"]
        }),
        deletenote:builder.mutation({
            query:(data) => ({url:API_URL.deletenote(data.noteId) , method:"DELETE"}),
            invalidatesTags:["notes"]
        }),
        getcrstats:builder.query({
            query:() => ({url:API_URL.getcrstats , method:"GET"}),
            providesTags:["notes" , "students"]
        }),

        getnotifications:builder.query({
            query:() => ({url:API_URL.getnotifications , method:"GET"}),
            providesTags:["notifications"]
        }),
        marknotificationsread:builder.mutation({
            query:(data) => ({url:API_URL.marknotificationsread , method:"POST" , body:data}),
            invalidatesTags:["notifications"]
        })

    })
})

export const {
    useLoginMutation , useLogoutMutation , useGetmeQuery , useChangepasswordMutation , useRespondcrMutation,
    useGetadminstatsQuery , useGetstructureQuery , useAddsectionMutation , useRenamesectionMutation,
    useArchivesectionMutation , useGetsectionQuery , useAddstudentMutation , useUpdatestudentMutation,
    useRemovestudentMutation , useGetallstudentsQuery , useResetpasswordMutation,
    useSelectcrMutation , useRemovecrMutation,
    useAddsubjectMutation , useUpdatesubjectMutation , useRemovesubjectMutation , useCopysubjectsMutation,
    useGetsubjectsQuery , useGetsubjectlistQuery , useGetnotesQuery , useGetmysubmissionsQuery,
    useSubmitnoteMutation , useReactnoteMutation,
    useViewnoteMutation , useGetrecentQuery , useClearrecentMutation,
    useGetsectionnotesQuery , useReviewnoteMutation , useDeletenoteMutation , useGetcrstatsQuery,
    useGetnotificationsQuery , useMarknotificationsreadMutation
} = Api;
