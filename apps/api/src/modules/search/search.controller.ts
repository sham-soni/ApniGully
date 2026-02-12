import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get(':neighborhoodId')
  @ApiOperation({ summary: 'Search in neighborhood' })
  search(
    @Param('neighborhoodId') id: string,
    @Query('q') query: string,
    @Query('type') type: 'all' | 'posts' | 'helpers' | 'shops' | 'rentals' = 'all',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.searchService.search(id, query, type, +page, +limit);
  }

  @Get(':neighborhoodId/suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  getSuggestions(@Param('neighborhoodId') id: string, @Query('q') query: string) {
    return this.searchService.getSuggestions(id, query);
  }
}
