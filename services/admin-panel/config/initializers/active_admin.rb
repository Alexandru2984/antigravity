# frozen_string_literal: true

ActiveAdmin.setup do |config|
  config.site_title = 'PolyMarket Admin'
  config.authentication_method = false
  config.current_user_method = false
  config.logout_link_path = false
  config.comments = false
end
