"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

export default function GyopDeveloperProfile(){

  const params = useParams();
  const id = params.id as string;

  const [developer,setDeveloper] = useState<any>(null);

  useEffect(()=>{

    const loadDeveloper = async ()=>{

      const ref = doc(db,"developers",id);

      const snap = await getDoc(ref);

      if(snap.exists()){
        setDeveloper(snap.data());
      }

    };

    loadDeveloper();

  },[id]);

  if(!developer) return <p>Loading...</p>;

  return(

    <main style={{padding:"40px",maxWidth:"700px",margin:"auto"}}>

      <h1>{developer.name}</h1>

     <p style={{marginTop:"5px",color:"gray"}}>
  {Array.isArray(developer.skills)
    ? developer.skills.join(", ")
    : developer.skills}
</p>
      <p style={{marginTop:"10px"}}>
        ⭐ {developer.rating}
      </p>

      <p>Projects: {developer.projects}</p>

      <h2 style={{marginTop:"30px"}}>Contact</h2>

      <p>Email: {developer.email}</p>

      <p>
        LinkedIn:
        <a href={developer.linkedin} target="_blank">
          {" "}View Profile
        </a>
      </p>

      <p>
        Meeting Link:
        <a href={developer.meetingLink} target="_blank">
          {" "}Start Discussion
        </a>
      </p>

    </main>

  );

}