/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Play, Share2, ChevronDown, ChevronUp, Video,  } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { YT_REGEX } from "@/lib/utils";
import "react-toastify/dist/ReactToastify.css";
import Appbar from "./Appbar";

import YouTubePlayer from "youtube-player";


interface Video {
  id: string;
  type: string;
  url: string;
  extractedId: string;
  title: string;
  smallImg: string;
  bigImg: string;
  active: boolean;
  userId: string;
  upvotes: number;
  haveUpvoted: boolean;
}

const REFRESH_INTERVAL_MS = 10 * 1000;

// const creatorId="085b1a5d-5773-482a-944c-898e5992e049";


export default function StreamView({ 
        creatorId,
        playVideo=false
      }: {
        creatorId: string;
        playVideo:boolean;
 }) {

  console.log(creatorId);
  const [inputLink, setInputLink] = useState("");
  const [queue, setQueue] = useState<Video[]>([]);
  const videoPlayerRef=useRef<HTMLDivElement>();
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

  const [loading, setLoading] = useState(false);
  const [playNextLoader, setPlayNextLoader] = useState(false);

  async function refreshStreams() {
    try {
      const res = await fetch(`/api/streams/?creatorId=${creatorId}`, {
        // method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      setQueue( json.streams.sort((a: any, b: any) => (a.upvotes < b.upvotes ? 1 : -1)));

      setCurrentVideo(video => {

        if(video?.id===json.activeStream?.stream?.id){
          return video;
          }
        return json.activeStream.stream
      });

    } catch (error) {
      console.error("Failed to fetch streams:", error);
    }
  }

  useEffect(() => {
    refreshStreams();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const interval = setInterval(() => {
      refreshStreams();
    },
     REFRESH_INTERVAL_MS);
  }, [])

  useEffect(()=>{

    if(!videoPlayerRef.current || !currentVideo || !currentVideo?.extractedId){
      return ;
    }
    
    // eslint-disable-next-line prefer-const
    let player=YouTubePlayer(videoPlayerRef.current);

    player.loadVideoById(currentVideo.extractedId);

    player.playVideo();
   
    function eventHandler(event:any){
      if(event.data===0){
        playNext();
      }
    };
    player.on('stateChange',eventHandler);

    return()=>{
      
      player.destroy();
    }
   
  },[currentVideo ,videoPlayerRef])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch("/api/streams/", {
        method: "POST",
        body: JSON.stringify({
          creatorId,
          url: inputLink,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }

      const newStream = await res.json();
      setQueue([...queue, newStream]);
    } catch (error) {
      console.error("Failed to add stream:", error);
      toast.error("Failed to add stream. Please try again.");
    } finally {
      setLoading(false);
      setInputLink("");
    }
  };

  const handleVote = (id: string, isUpvote: boolean) => {
    setQueue(
      queue
        .map((video) =>
          video.id === id
            ? {
                ...video,
                upvotes: isUpvote ? video.upvotes + 1 : video.upvotes - 1,
                haveUpvoted: !video.haveUpvoted,
              }
            : video
        )
        .sort((a, b) => b.upvotes - a.upvotes)
    );

    fetch(`/api/streams/${isUpvote ? "upvote" : "downvote"}`, {
      method: "POST",
      body: JSON.stringify({
        streamId: id,
      }),
    });
  };

  const playNext = async () => {
    if (queue.length > 0) {
      try{
        setPlayNextLoader(true);
        const data=await fetch('/api/streams/next', {
          method:"GET",
        })
        const json= await data.json();
  
        setCurrentVideo(json.stream);
        setQueue(q=>q.filter(x => x.id !== json.stream?.id))
      } catch(e){

      }

      setPlayNextLoader(false)
      
    }
  };

  const handleShare = () => {
    const shareableLink = `${window.location.href}/creator/${creatorId}`;
    // const shareableLink=window.location.href;

    navigator.clipboard.writeText(shareableLink).then(
      () => {
        toast.success("Link copied to clipboard", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      },
      (err) => {
        console.error("could not copy text:", err);
        toast.error("failed to copy link. Please try again ", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[rgb(10,10,10)] text-gray-200">
      <Appbar />
      <div className="flex justify-center">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5 w-screen pt-8 max-w-screen-xl">
          <div className="col-span-3">
            <div className="space-y-4 ">
              <h2 className="text-2xl font-bold text-white"> Upcoming Songs</h2>
              {queue.length===0  && 
               <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4">
              <p className="text-center py-8 text-gray-400"> No videos in queue</p>
              </CardContent>
                </Card> }
              {queue.map((video) => (
                <Card key={video.id} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4 flex items-center space-x-2 ">
                    <Image
                      src={video.smallImg}
                      width={120}
                      height={90}
                      alt={`Thumbnail for ${video.title}`}
                      className="w-30 h-auto object-cover rounded"
                    />

                    <div className="flex-grow">
                      <h3 className="font-semibold text-white">
                        {video.title}{" "}
                      </h3>
                      <div className="flex items-center space-x-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleVote(
                              video.id,
                              video.haveUpvoted ? false : true
                            )
                          }
                          className="flex items-center space-x-1 bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                        >
                          {video.haveUpvoted ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4 " />
                          )}
                          <span> {video.upvotes} </span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <div className="max-w-4xl mx-auto p-4 space-y-6 w-full ">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white "> Add a song </h1>
                <Button
                  onClick={handleShare}
                  className="bg-purple-700 hover:bg-purple-800 text-white"
                >
                  <Share2 className="mr-2 h-4 w-4 " />
                  Share
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2">
                <Input
                  type="text"
                  placeholder="paste Youtube link here"
                  value={inputLink}
                  onChange={(e) => setInputLink(e.target.value)}
                  className="bg-gray-900 text-white border-gray-700 placeholder-gray-500"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  type="submit"
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white"
                >
                  {" "}
                  {loading ? "..loading" : "Add to Queue"}
                </Button>
              </form>

              {inputLink && inputLink.match(YT_REGEX) && !loading && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4">
                    <LiteYouTubeEmbed title="" id={inputLink.split("?v=")[1]} />
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white"> Now Playing </h2>
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4">
                    {currentVideo ? (
                      <div>
                        {playVideo ? <>

                        
                        {/*@ts-ignore */}
                          <div ref={videoPlayerRef} className="w-full"/>
                          {/* <iframe src={`https://www.youtube.com/embed/${currentVideo.extractedId}?autoplay=1`}
                          allow="autoplay"></iframe> */}
                        </> : 
                         <>
                         <Image
                           src={currentVideo.bigImg}
                           width={320}
                           height={200}
                           alt="Current Video"
                           className="w-full h-72 object-cover rounded  "
                         />
                         <p className="mt-3 text-center font-semibold text-white ">
                           {currentVideo.title}
                         </p>
                       </>}
                      
                     
                      </div>
                    ) : (
                      <p className="text-center py-8 text-gray-400 ">
                        {" "}
                        No video playing{" "}
                      </p>
                    )}
                  </CardContent>
                </Card>
               {playVideo && <Button
                  onClick={playNext}
                  disabled={playNextLoader}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white "
                >
                  <Play className="mr-3 h-4 w-4" /> {playNextLoader ? "Loading...":"Play Next"}
                </Button>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}
