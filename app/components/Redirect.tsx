"use client";

import { User } from "lucide-react";
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Redirect(){

    const session=useSession();

    const router=useRouter();

    useEffect(()=>{
        if(session?.data?.user){
            console.log(User);
            router.push("/dashboard");

        }
    },[router, session])


    return null
}