import StreamView from "@/app/components/StreamView";

interface Props {
  params: {
    creatorId: string;
  };
}

export default function StreamPage({ params: { creatorId } }: Props) {
  return (
    <div>
      <StreamView creatorId={creatorId} playVideo={false} />
    </div>
  );
}