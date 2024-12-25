library(rvest)

html_folder <- "collected_html"

html_files <- list.files(html_folder, pattern = "\\.html$", full.names = TRUE)

comments_from_files <- function(file_path) {
  page <- read_html(file_path, encoding = "UTF-8")
  
  comment_nodes <- page %>% 
    html_elements(".reply_wrap")  
  
  all_comments <- lapply(comment_nodes, function(node) {
    
    author <- node %>% 
      html_element(".reply_author") %>%
      html_text2()
    
    date <- node %>%
      html_element(".reply_date .rel_date") %>%
      html_text2()
    
    comment_text <- node %>%
      html_element(".wall_reply_text") %>%
      html_text2()
    
    data.frame(
      file   = basename(file_path), 
      author = author,
      date   = date,
      text   = comment_text,
      stringsAsFactors = FALSE
    )
  })
  
  if (length(all_comments) > 0) {
    do.call(rbind, all_comments)
  } else {
    data.frame(
      file   = basename(file_path),
      author = character(),
      date   = character(),
      text   = character(),
      stringsAsFactors = FALSE
    )
  }
}

all_data <- lapply(html_files, comments_from_files)

leftover_comments<- do.call(rbind, all_data)

save(leftover_comments, file = "leftover_comments.RData")
write.csv(leftover_comments, file = "leftover_comments.csv")

