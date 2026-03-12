export async function uploadToCloudinary(file: File) {

  const formData = new FormData();
  formData.append("file", file);

  formData.append("upload_preset", "zenith-cloud");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dq5mkuj9y/image/upload",
    {
      method: "POST",
      body: formData
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Upload failed");
  }

  let url = data.secure_url;

  // PERFORMANCE OPTIMIZATION
  url = url.replace(
    "/upload/",
    "/upload/w_600,q_auto,f_auto/"
  );

  return url;
}