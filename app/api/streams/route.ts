import { prismaClient } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import youtubesearchapi from "youtube-search-api";
import { YT_REGEX } from "@/lib/utils";
import { getServerSession } from "next-auth";


const CreateStreamSchema=z.object({
    creatorId : z.string(),
    url : z.string()
})

const MAX_QUEUE_LEN=20;

export async function POST(req:NextRequest){
    try {
        const data = CreateStreamSchema.parse(await req.json());
        const isYt=data.url.match(YT_REGEX);

        if(!isYt){
            return NextResponse.json({
                message:"wrong url format"
            },{
                status:411
            })
        }

        const extractedId=data.url.split("?v=")[1];

        const res=await youtubesearchapi.GetVideoDetails(extractedId);
      
        const thumbnails= res.thumbnail.thumbnails;
        thumbnails.sort((a: {width:number}, b: {width:number})=> a.width < b.width ?-1:1);
        
        const existingActiveStream= await prismaClient.stream.count({
            where:{
                userId:data.creatorId
            }
        })

        if(existingActiveStream> MAX_QUEUE_LEN){
            return NextResponse.json({
                message:"Already at limit"
            },{
                status:411
            })
        }

       const stream= await prismaClient.stream.create({

             data : {
             userId: data.creatorId,
             url: data.url,
             extractedId,
             addedById: data.creatorId,
             type: "Youtube",
             title:res.title ?? "cant find video ",
             smallImg:( thumbnails.length>1 ? thumbnails[thumbnails.length-2].url :thumbnails[thumbnails.length -1].url) ?? "https://salonlfc.com/wp-content/uploads/2018/01/image-not-found-1-scaled.png",
             bigImg: thumbnails[thumbnails.length -1].url ?? "https://salonlfc.com/wp-content/uploads/2018/01/image-not-found-1-scaled.png"
            }
            

        });
        return NextResponse.json({
           ...stream,
           hasUpvotes:false,
           upvotes:0
        })
    } catch (e) {
        console.error("Error details:", e);
        return NextResponse.json({
            message:"error while adding a stream"
        },{
            status:411
        })
    }
}

export async function GET(req: NextRequest){
    const creatorId=req.nextUrl.searchParams.get("creatorId");
    const session= await getServerSession();


    const user = await prismaClient.user.findFirst({


        where: {
            email:session?.user?.email?? "",
        },
    });
    

    if(!user){
        return NextResponse.json({
            message:"Unauthenticated"
        },{
            status:403
        })
    }

    if(!creatorId){
        return  NextResponse.json({
            messgae: "Error"
        }, {
            status: 411
        })
    }
    const [streams,activeStream]= await Promise.all([await prismaClient.stream.findMany({
        where:{
            userId:creatorId,
            played:false  
        },
        include:{
            _count:{
                select:{
                    upvotes:true
                }
            },
            upvotes:{
                where:{
                    userId:user.id 
                }
            }
        }
    }), prismaClient.currentStream.findFirst({
        where:{
            userId:creatorId
        },
        include:{
            stream:true
        }
    }) ])
    
    return NextResponse.json({
        streams :streams.map(({_count,...rest})=>({
            ...rest,
            upvotes:_count.upvotes,
            haveUpvoted:rest.upvotes.length? true : false
        })),
        activeStream
    })
}