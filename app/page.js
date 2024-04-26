"use client"
import Image from "next/image"
import  StandardToolBar from './menus/standardToolBar.js'
import { useState, useEffect } from "react"
import { useRouter } from "next/router.js"
import Cookies from 'js-cookie'
import axios from "axios"

export default function Home(){
	return (
		<div className="bg-gray-900 text-white">
			<StandardToolBar/>
			<div className="h-screen flex flex-col justify-center items-center">
				{/* Login with Discord */}
				<div className="flex justify-center items-center mb-4">
					<a href="https://discord.com/oauth2/authorize?client_id=1230876587256315974&response_type=code&redirect_uri=http%3A%2F%2F127.0.0.1%3A5050%2Fapi%2Fauth%2Fdiscord%2Flogin&scope=identify+email" className="flex items-center justify-center text-white font-bold py-2 px-4 rounded-lg" style={{backgroundColor: '#5a64ea'}} rel="noreferrer noopener">
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