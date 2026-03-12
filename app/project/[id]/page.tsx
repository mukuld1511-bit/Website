"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Viewer from "../../components/Viewer";

export default function ProjectPage(){

  const params = useParams();
  const id = params?.id as string;

  const [project,setProject] = useState<any>(null);

  const loadProject = async()=>{

    const ref = doc(db,"projects",id);
    const snap = await getDoc(ref);

    if(snap.exists()){
      setProject(snap.data());
    }

  };

  useEffect(()=>{
    if(id) loadProject();
  },[id]);

  if(!project) return <p style={{padding:"40px"}}>Loading project...</p>;


  return(

    <main style={{padding:"40px",maxWidth:"900px",margin:"auto"}}>

      {/* TITLE */}

      <h1 style={{fontSize:"32px"}}>
        {project.title}
      </h1>

      <p style={{color:"#888"}}>
        {project.projectType} Project
      </p>


      {/* PREVIEW */}

      <div style={{marginTop:"20px"}}>

        {/* 3D PROJECT */}

        {project.projectType === "3D" && project.modelUrl && (

          <Viewer modelUrl={project.modelUrl}/>

        )}


        {/* AR / VR PROJECT */}

        {project.projectType !== "3D" && (

          <div>

            {/* DEMO IMAGES */}

            {project.demoImagesUrls && project.demoImagesUrls.length > 0 && (

              <div
                style={{
                  display:"flex",
                  gap:"10px",
                  flexWrap:"wrap",
                  marginBottom:"15px"
                }}
              >

                {project.demoImagesUrls.map((img:string,i:number)=>(
                  <img
                    key={i}
                    src={img}
                    style={{
                      width:"220px",
                      borderRadius:"6px"
                    }}
                  />
                ))}

              </div>

            )}


            {/* DEMO VIDEO */}

            {project.demoVideoUrl && (

              <video
                controls
                style={{
                  width:"100%",
                  maxWidth:"600px",
                  borderRadius:"8px"
                }}
              >
                <source src={project.demoVideoUrl}/>
              </video>

            )}

          </div>

        )}

      </div>


      {/* DESCRIPTION */}

      <div style={{marginTop:"30px"}}>

        <h3>Description</h3>

        <p style={{color:"#777"}}>
          {project.shortDescription || "No description provided"}
        </p>

      </div>


      {/* TECHNOLOGY */}

      {project.technologies && (

        <div style={{marginTop:"20px"}}>

          <h3>Technologies Used</h3>

          <p style={{color:"#888"}}>
            {project.technologies}
          </p>

        </div>

      )}

    </main>

  );

}