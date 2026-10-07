export default function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  const widgetId=process.env.MSG91_WIDGET_ID;
  const tokenAuth=process.env.MSG91_WIDGET_TOKEN;
  if(!widgetId||!tokenAuth) return res.status(500).json({error:"MSG91 widget configuration is missing"});
  res.setHeader("Cache-Control","no-store");
  return res.status(200).json({widgetId,tokenAuth});
}
