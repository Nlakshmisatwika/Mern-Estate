import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { BsPlusCircleFill } from "react-icons/bs";
import { useRef } from "react";
import { storage } from "../firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useDispatch } from "react-redux";
import { removeError, updateUserFailure, updateUserStart, updateUserSuccess } from "../redux/user/userSlice";
import axios from "axios";


const Profile = () => {

  type User = {
    username?: string;
    email?: string;
    password?: string;
    profilePicture?: string;
  };

  const { currentUser, error } = useSelector((state: any) => state.user);
  const dispatch = useDispatch();
  const picture = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileUploadError, setFileUploadError] = useState<string>("");

  const [successMsg, setSuccessMsg] = useState(false);
  const [formData, setFormData] = useState<User>({
    profilePicture: currentUser.profilePicture,
  });

  useEffect(() => {
    if (file) handleFileUpload(file);
    
  }, [file]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const fileName = new Date().getTime() + file?.name;

    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(progress));
          console.log("Upload is " + progress + "% done");
      },
      (error: Error) => {
        // console.log(error.message);
        setFileUploadError(error.message);
      },
      () => {
        // console.log("Upload complete");
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL: string) => {
          // console.log("File available at", downloadURL);
          // currentUser.profilePicture = downloadURL;
          dispatch(updateUserSuccess({ ...currentUser, profilePicture: downloadURL }));
          setFormData({ ...formData, profilePicture: downloadURL });
          console.log(formData);
        });
        setUploading(false);
        setProgress(0);
      }
    );
  };

  // console.log(formData);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const res = await axios.post(`/api/user/update/${currentUser.id}`, formData);
      console.log(res);
      if (res.status === 200) {
        dispatch(updateUserSuccess(res.data));
        setSuccessMsg(true);
          setTimeout(() => {
            setSuccessMsg(false);
          }, 3000);
        return;

      } else {
        dispatch(updateUserFailure(res.data.message));
        setTimeout(() => {
          dispatch(removeError());
        }, 3000);
      }

    } catch (error : any) {
      dispatch(updateUserFailure(error.response.data.message));
      setTimeout(() => {
        dispatch(removeError());
      }, 3000);
    }
  }

  return (
    <div className="container mt-8 p-3 max-w-2xl mx-auto flex flex-col gap-6 items-center">
      <h1 className="font-bold text-3xl">Profile</h1>
      <div className="relative">
        <img
          src={currentUser.profilePicture || "https://via.placeholder.com/150"}
          alt="profile"
          className="w-24 h-24 rounded-full object-cover"
          style={uploading ? { filter: "blur(2px)" } : {}}
        />
        <div
          className="absolute bottom-0 border-2 border-white right-0 rounded-full text-purple-700 cursor-pointer"
          onClick={() => picture.current?.click()}
        >
          <BsPlusCircleFill size={20} />
        </div>
        {!fileUploadError && <p className="text-red-500">{fileUploadError}</p>}

        {uploading && (
          <div className="absolute -bottom-2 w-full flex flex-col gap-2 bg-slate-200">
            <div
              className="bg-purple-700 h-1"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
      <form 
      className="flex flex-col space-y-3 w-full"
      onSubmit={handleSubmit}
      >
        <input
          className="border p-3 rounded-md focus:outline-none"
          type="text"
          placeholder="Username"
          id="username"
          defaultValue={currentUser.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
        <input
          className="border p-3 rounded-md focus:outline-none"
          type="email"
          placeholder="Email"
          id="email"
          defaultValue={currentUser.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          className="border p-3 rounded-md focus:outline-none"
          type="password"
          placeholder="Password"
          id="password"
          value={currentUser.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <input
          ref={picture}
          type="file"
          accept=".png, .jpeg"
          name="file"
          id="file"
          hidden
          onChange={(e) => setFile(e.target.files![0])}
        />
        <button disabled={uploading} className="bg-purple-700 text-white p-3 rounded-md">
          {uploading ? "Uploading..." : "Update"}
        </button>
        {successMsg && <span className="text-green-500">Updated successfully</span>}
        {error && <span className="text-red-500">{error}</span>}
        
      </form>
      <div className="flex justify-between w-full">
        <span className="text-red-500 font-semibold">Delete Account</span>
        <span className="text-red-500 font-semibold">Sign out</span>
      </div>
    </div>
  );
};

export default Profile;
