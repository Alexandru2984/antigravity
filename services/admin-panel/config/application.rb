# frozen_string_literal: true

require_relative 'boot'

require 'rails/all'

Bundler.require(*Rails.groups)

module AdminPanel
  # Rails application shell for the production admin surface.
  class Application < Rails::Application
    config.load_defaults 7.2

    config.api_only = false
  end
end
