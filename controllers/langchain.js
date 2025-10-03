import axios from "axios";

export const getTrendingGDTopics = async (req, res) => {
  try {
    const { category, top_k } = req.query;

    const response = await axios.get(
      `${process.env.LANGCHAIN_SERVER_URL}trending-gd-topics`,
      {
        params: { category, top_k },
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error("Error fetching from LangChain server:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Failed to fetch trending GD topics" });
  }
};
