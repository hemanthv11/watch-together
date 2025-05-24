"use client"
import Image from "next/image"
import  StandardToolBar from './menus/standardToolBar.js'
import dotenv from 'dotenv'
import { useState, useEffect } from "react"
import { useRouter } from "next/router.js"
import Cookies from 'js-cookie'
import axios from "axios"

dotenv.config()

export default function Home(){
	return (
		<div className="bg-gray-900 text-white">
			<StandardToolBar/>
			<div className="h-screen flex flex-col justify-center items-center">
				{/* Login with Discord */}
				<div className="flex justify-center items-center mb-4">
					<a href={process.env.DISCORD_AUTH} className="flex items-center justify-center text-white font-bold py-2 px-4 rounded-lg" style={{backgroundColor: '#5a64ea'}} rel="noreferrer noopener">
						<Image src="/discord.svg" width={24} height={24} alt="Discord Logo" />
						<span className="ml-2">Login with Discord</span>
					</a>
				</div>
				{/* A coming soon block to house sign in with google */}
				<div className="flex justify-center items-center">
					<div className="flex justify-center items-center mb-4 mt-8 width-full px-4 rounded-lg" style={{backgroundColor: 'gray'}}>
						<div className="flex items-center justify-center text-white font-bold py-2 px-4 rounded-lg">
							<Image src="/google.svg" width={24} height={24} alt="Google Logo" />
							<span className="ml-2">Coming Soon</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	)	
}