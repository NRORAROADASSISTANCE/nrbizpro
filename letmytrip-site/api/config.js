module.exports = function(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  const widgetId=process.env.MSG91_WIDGET_ID||"";
  const tokenAuth=process.env.MSG91_WIDGET_TOKEN||"";
  return res.status(200).json({widgetId,tokenAuth,configured:Boolean(widgetId&&tokenAuth)});
};
