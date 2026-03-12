"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Link from "next/link";

export default function GyopDevelopers(){

  const [developers,setDevelopers] = useState<any[]>([]);
  const [search,setSearch] = useState("");

  useEffect(()=>{

    const loadDevelopers = async ()=>{

      const snapshot = await getDocs(collection(db,"developers"));

      const list:any[] = [];

      snapshot.forEach((doc)=>{
        list.push({ id:doc.id, ...doc.data() });
      });

      setDevelopers(list);

    };

    loadDevelopers();

  },[]);

  const filtered = developers.filter((dev)=>
    dev.skills?.toLowerCase().includes(search.toLowerCase()) ||
    dev.name?.toLowerCase().includes(search.toLowerCase())
  );

  return(

    <main style={{padding:"40px", maxWidth:"900px", margin:"auto"}}>

      <h1>Find Developer</h1>

      <p style={{marginTop:"10px", color:"#555"}}>
        Browse developers and send them project enquiries.
      </p>

      <input
        type="text"
        placeholder="Search developers..."
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
        style={{
          marginTop:"25px",
          padding:"12px",
          width:"100%",
          maxWidth:"450px",
          border:"1px solid #ddd",
          borderRadius:"8px"
        }}
      />

      <div style={{marginTop:"30px"}}>

        {filtered.map((dev)=>(

          <Link key={dev.id} href={`/gyop/developer/${dev.id}`}>

            <div
  style={{
    border:"1px solid #ddd",
    padding:"15px",
    borderRadius:"10px",
    display:"flex",
    gap:"15px",
    alignItems:"center"
  }}
>

<img
  src={dev.profileImage || "/avatar.png"}
  style={{
    width:"60px",
    height:"60px",
    borderRadius:"50%",
    objectFit:"cover"
  }}
/>

<div>

  {dev.certified && (
    <p style={{color:"gold",fontSize:"12px"}}>
      ⭐ Synthé Certified
    </p>
  )}

  <h3>{dev.name}</h3>

  <p style={{color:"#666"}}>
    {Array.isArray(dev.skills)
      ? dev.skills.join(", ")
      : dev.skills}
  </p>

  <p>⭐ {dev.rating}</p>

</div>

</div>
          </Link>

        ))}

      </div>

    </main>

  );

}