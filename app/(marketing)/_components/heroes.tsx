import Image from 'next/image'
import React from 'react'

const Heroes = () => {
  return (
    <div className='flex flex-col items-center justify-center max-w-5xl'>
        <div className='flex items-center'>
            <div className='relative w-[300px] sm:w-[350px] sm:h-[350px] md:h-[400px]'>
                <Image
                    src="/document.png"
                    fill
                    alt="Document"
                    className='object-contain dark:hidden'
                />
                <Image
                    src="/document-dark.png"
                    fill
                    alt="Document"
                    className='object-contain hidden dark:block'
                />
            </div>
            <div className='relative h-[400px] w-[400px] hidden md:block'>
                <Image
                    src="/reading.png"
                    fill
                    alt="Reading"
                    className='object-contain dark:hidden'
                />
                <Image
                    src="/reading-dark.png"
                    fill
                    alt="Reading"
                    className='object-contain hidden dark:block'
                />
            </div>
        </div>
    </div>
  )
}

export default Heroes