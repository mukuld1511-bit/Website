export async function uploadToCloudinary(file: File, resourceType: "image" | "auto" = "image") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "zenith-cloud");
  formData.append("resource_type", resourceType);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType === "image" ? "image" : "raw"}/upload`,
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

  if (resourceType === "image") {
    url = url.replace("/upload/", "/upload/w_600,q_auto,f_auto/");
  }

  return url;
}