import { auth, UserButton, currentUser, clerkClient, } from '@clerk/nextjs';
import SpotifyWebApi from 'spotify-web-api-node';


export default async function Page() {
  const { userId, getToken, session } = auth();

  if (!userId) return <div>Loggin failed.</div>

  const user = await currentUser();

  const tokens = await clerkClient.users.getUserOauthAccessToken(userId, "oauth_spotify")
  if (!tokens || tokens.length === 0) return <div>Loggin failed 3.</div>

  const token = tokens[0]!.token

  if (!user) return <div>Loggin failed 2.</div>


  const spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    accessToken: token
  })

  const { body: profile } = await spotify.getMe()

  const { body: playlists } = await spotify.getUserPlaylists(profile.id)

  const playlist = (await spotify.getPlaylist(playlists.items[0]?.id!)).body

  const randomTracks = getRandomTracksFromPlaylist({ playlist, amount: 4 })

  try {
    spotify.play({
      uris: [randomTracks[0]!.uri]
    })
  } catch (error) {
    console.log("Error playing track:", error)
  }

  return (
    <>
      <UserButton afterSignOutUrl='/' />
      <div className='flex justify-between gap-3 px-3'>
    	  {
          shuffleArray(randomTracks).map(track => {
            return (
              <button key={track.id} className='flex flex-col justify-center items-center'>
                <img src={track.album.images[0]?.url} alt={track.name} className='w-1/2' />
                <p className='text-xl'>{track.name}</p>
                <p className='text-neutral-400'>{track.artists[0]?.name}</p>
              </button>
            )
          })
        }
      </div>
    </>
  )
}

function getRandomTracksFromPlaylist(
  { playlist, amount }: { playlist: SpotifyApi.SinglePlaylistResponse, amount: number }
) {

  if (amount < 1) throw new Error("Amount must be greater than 0")

  const tracks = new Set<SpotifyApi.TrackObjectFull>()
  const playListLength = playlist.tracks.items.length

  while(tracks.size < amount) {

    const randomTrackNumber = Math.floor(Math.random() * playListLength)

    const randomTrack = playlist.tracks.items[randomTrackNumber]!.track!

    tracks.add(randomTrack)
  }
  return [...tracks]
}

function shuffleArray<T>(array: T[]) {
  return array.sort(() => Math.random() - 0.5);
}