import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { Api, useLogoutMutation } from "../../store/Api/Api";
import { setUser } from "../../store/slice/UserSlice";
import { setPasswordPopup } from "../../store/slice/PortalSlice";

export const useAccountActions = () =>{
    const Navigate = useNavigate();
    const dispatch = useDispatch();
    const [logout] = useLogoutMutation();

    const handleLogout = async () =>{
        try{
            const result = await logout().unwrap();
            dispatch(setUser(false));
            dispatch(Api.util.resetApiState());
            toast.success(result.message || "Logged Out");
            Navigate("/");
        }
        catch(error){
            toast.error(error?.data?.message || "Logout Failed");
        }
    }

    const handleChangePassword = () =>{
        dispatch(setPasswordPopup(true));
    }

    return {handleLogout , handleChangePassword};
}
