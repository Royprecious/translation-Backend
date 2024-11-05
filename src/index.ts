import bodyParser from "body-parser";
import express from "express";
import cors from "cors";
import routes from "./routes/api";
import blogRoutes from "./blogRoutes/blogApis";

const app = express();
const port = 3004;

app.use(bodyParser.json());

app.use(cors());

app.use("/api", routes);
app.use("/blog_api", blogRoutes)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
