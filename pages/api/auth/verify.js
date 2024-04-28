import tokenVerifier from "@/utils/verify"

export default async function handler(req, res) {
    const token = req.cookies.token
    if(token) {
        const user = await tokenVerifier(token)
        if(user && user.error) {
            res.status(401).json({ loggedIn: false })
            return
        }
        res.status(200).json({ loggedIn: true })
    } else {
        res.status(401).json({ loggedIn: false })
    }
}