import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { Api, useLogoutMutation } from "../../store/Api/Api";
import { setUser } from "../../store/slice/UserSlice";
import { setPasswordPopup } from "../../store/slice/PortalSlice";

// log out / change password - shared by the sidebar and the profile menu
export const useAccountActions = () =>{
    const Navigate = useNavigate();
    const dispatch = useDispatch();
    const [logout] = useLogoutMutation();

    //$ function to handle logout
    const handleLogout = async () =>{
        try{
            const result = await logout().unwrap();
            dispatch(setUser(false));
            dispatch(Api.util.resetApiState());      // forget every loaded list
            toast.success(result.message || "Logged Out");
            Navigate("/");
        }
        catch(error){
            toast.error(error?.data?.message || "Logout Failed");
        }
    }

    //$ function to open the change password form
    const handleChangePassword = () =>{
        dispatch(setPasswordPopup(true));
    }

    return {handleLogout , handleChangePassword};
}
