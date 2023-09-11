const mongoose = require('mongoose')
const marked = require('marked')
const createDomPurify = require('dompurify')
const {JSDOM} = require('jsdom')
const dompurify = createDomPurify(new JSDOM().window)

const articleSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description:{
    type: String
  },
  markdown: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  sanitizedHtml: {
    type: String,
    required: true
  }
})

articleSchema.pre('validate', (next)=> {
  if (this.markdown) {
    this.sanitizedHtml = dompurify.sanitize(marked(this.markdown))
  }
  next()
})

Article =mongoose.model("Article", articleSchema)

module.exports = Article