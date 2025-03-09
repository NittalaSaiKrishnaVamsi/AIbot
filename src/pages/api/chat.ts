import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { user_message } = req.body;
        const response = await axios.post("http://localhost:8001/chat/", { user_message });

        return res.status(200).json(response.data);
    } catch (error) {
        console.error("Backend error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
