require 'honey_format'
require 'json'

# CSV-header:
#   "id"
#   "Card Name"
#   "Card ID"
#   "Email"
#   "Member No"
#   "Status"
#   "Created Date"
#   "Card Field 'Race day'"
#   "Card Field 'Swish 200 kr '"
#   "Card Field 'Paid'"
#   "Card Field 'Name'"
#   "Card Field 'Laps'"
#   "Card Field 'When'"
#   "Card Field 'Where'"
#   "Card Field 'Race type'"
#   "Card Field 'Race price'"
#   "Card Field 'Website'"
#   "Card Field 'Google Maps loop route'"
#   "Card Field 'Strava loop route'"
#   "Card Field 'Email'"
#   "Card Field 'Paid-bool'"
#   "Card Field 'Announcement'"
#   "Card Field 'Announcement URL'"
#   "Card Field 'utm_source'"
#   "Card Field 'utm_term'"
#   "Card Field 'utm_medium'"
#   "Card Field 'utm_campaign'"
#   "Card Field 'referrer'"
#   "Card Field 'source'"
#   "Card Field 'Refer a friend'"
#   "Card Field 'Powered by'"

path = ARGV[0]
if path.nil?
  puts "Please provide a path to the CSV file."
  exit(1)
end

unless File.exist?(path)
  puts "File not found: #{path}"
  exit(1)
end

lines = File.readlines(path)
lines[0] = lines[0].gsub('"', '') # remove quotes from header, causes issues with CSV parsing
csv_file = lines.join("\n")

csv = HoneyFormat::CSV.new(
  csv_file,
  header_converter: { "Card Field 'Paid-bool'" => :has_paid, },
  type_map: { has_paid: :boolean },
)

# 1. Send email to everyone that hasn't register a wallet pass
#   a. split them on paid vs unpaid
# 2. Send an email to everyone that hasn't paid
# 3. Send an email to everyone that has paid

paid = []
unpaid = []

csv.rows.each do |row|
  if row.has_paid
    paid << row
    puts row.email
  else
    unpaid << row
  end
end

puts "total_paid,total_unpaid"
puts "#{paid.size},#{unpaid.size}" 
