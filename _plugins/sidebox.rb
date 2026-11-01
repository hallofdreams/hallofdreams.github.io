# Sidebox: lets posts and pages write
#
#   <sidebox>
#   Some *markdown* that belongs off to the side.
#   </sidebox>
#
# or <sidebox title="A heading">...</sidebox>, and turns it into an
# <aside class="sidebox"> that kramdown still renders markdown inside of
# (that's what markdown="1" does). Styling lives in assets/css/post.scss.

module Sidebox
  # title may be double- or single-quoted; an apostrophe inside double quotes is fine
  OPEN  = /<sidebox(?:\s+title=(?:"([^"]*)"|'([^']*)'))?\s*>/i
  CLOSE = /<\/sidebox\s*>/i

  def self.convert(content)
    content
      .gsub(OPEN) do
        title = Regexp.last_match(1) || Regexp.last_match(2)
        html = '<aside class="sidebox" markdown="1">'
        html += "\n<p class=\"sidebox-title\">#{title}</p>\n" if title && !title.empty?
        html
      end
      .gsub(CLOSE, '</aside>')
  end
end

Jekyll::Hooks.register [:posts, :pages], :pre_render do |doc|
  doc.content = Sidebox.convert(doc.content) if doc.content&.include?('<sidebox')
end
