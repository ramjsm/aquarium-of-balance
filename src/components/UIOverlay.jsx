export default function UIOverlay({ screen, setScreen }) {
  return (
    <>
      { screen === 'intro' && (<div className='absolute top-0 left-0 flex flex-col gap-2 w-screen h-screen'>
        <div className="mx-auto my-auto">
          <h1 className='font-black text-4xl -tracking-[0.07rem] mix-blend-overlay'>Aquarium of Balance</h1>
          <p className='whitespace-pre-wrap mix-blend-overlay'>
            Behind the glass, silence rests. <br></br>
            Here, light and shadow drift in harmony. <br></br>
            With your breath, the stillness awakens. <br></br>
          </p>
          <div className='mt-4'>
            <button onClick={() => setScreen('exp')} className='border border-black px-2 py-1 mix-blend-overlay cursor-pointer'>Enter the still waters</button>
          </div>
        </div>
      </div>)}
      { screen === 'exp' && (<>
        <div className="absolute left-10 top-10">
          <h1 className='font-black text-4xl -tracking-[0.07rem] mix-blend-overlay'>Your breath stirs the stillness</h1>
          <p className='whitespace-pre-wrap mix-blend-overlay'>
            Enable microphone and breathe to interact
          </p>          
        </div>
        <div className="absolute right-10 bottom-5">
            <div className="flex gap-4 items-end mix-blend-overlay">
                <a href="https://www.ramsessalas.com/" target="_blank" rel="noopener noreferrer">Interaction Design / Ramses Salas</a>
                <a href="https://soundcloud.com/lefleuve" target="_blank" rel="noopener noreferrer">Sound Design / Thibauth Bournazac</a>
            </div>
        </div>
      </>)}
    </>
  )
}
