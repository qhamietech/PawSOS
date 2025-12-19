import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { db } from "./src/config/db.js";
import { favoritesTable } from "./src/db/schema.js";
import { eq, and } from "drizzle-orm";



const app = express();
app.use(express.json());
const PORT = process.env.PORT ||5001



app.get("/api/health", (req, res) => {
  res.status(200).json({sucess: true});
});

app.post("/api/favorites", async (req, res) => {
 try {
  const{userId, recipeId, title, image, cookTime, servings} = req.body;
  if(!userId||!recipeId||!title){
    return res.status(400).json({error: "Missing required fields"});
  }

const newFavorite = await db.insert(favoritesTable).values({
  userId,
  recipeId,
  title,
  image,
  cookTime,
  servings,
}).returning();

res.status(201).json(newFavorite[0])

 } catch (error) {
  console.log("Error adding favorite", error)
  res.status(500).json({error: "Something went wrong"});
 }
});

app.delete("/api/favorites/:userId/:recipeId", async (req, res) => {
  try {
    const { userId, recipeId } = req.params;
    await db
      .delete(favoritesTable)
      .where(
        and(
          eq(favoritesTable.userId, parseInt(userId)),  // ← Parse userId here
          eq(favoritesTable.recipeId, parseInt(recipeId))
        )
      );
    res.status(200).json({ message: "Favorite removed successfully" });
  } catch (error) {
    console.log("Error removing a favorite", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/favorites/:userId", async (req, res) => {
  try {
    const {userId} =req.params;
    
    const userFavorites = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId));

    res.status(200).json(userFavorites);
    
  } catch (error) {
     console.log("Error fetching  favorites", error);
    res.status(500).json({ error: "Something went wrong" })
  }
});

app.listen(PORT, () => {
  console.log("Server running on port:", PORT);
});
