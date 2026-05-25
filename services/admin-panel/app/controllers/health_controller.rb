# frozen_string_literal: true

# Health and readiness endpoints used by Compose and CI.
class HealthController < ApplicationController
  def show
    render json: { status: 'ok', service: 'admin-panel' }
  end

  def ready
    render json: { status: 'ready' }
  end
end
