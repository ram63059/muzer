"use client";

import { signIn, signOut, useSession } from 'next-auth/react'
import React from 'react'
import { Button } from "@/components/ui/button";
// import Link from "next/link";

const Appbar = () => {

    const session=useSession();
  return (

        <div className='flex justify-between px-20 pt-4'>
            <div className="text-2xl font-bold flex flex-col jsutify-center text-white">
                muzer
            </div>
            <div>
                {session.data?.user &&<Button className='bg-purple-600 text-white hover:bg-purple-700' onClick={()=>signOut()}> Logout</Button>}
                {!session.data?.user &&<Button className='bg-purple-600 text-white hover:bg-purple-700' onClick={()=>signIn()}> Signin</Button>}

            </div>

        </div>
    
  )
}

export default Appbar